import { z } from "zod"
import { prisma } from "../lib/prisma"
import { ErrorResponse } from "../utils/response"
import orderValidation from "../validations/orderValidation"
import config from "../config"
import cartService from "./cartService"
import destinationService from "./destinationService"
import { EnumOrderStatus } from "../../generated/prisma/client"

import midtransClient from "midtrans-client"

const snap = new midtransClient.Snap({
  isProduction: config.midtransIsProduction,
  serverKey: config.midtransServerKey,
  clientKey: config.midtransClientKey,
})

const coreApi = new midtransClient.CoreApi({
  isProduction: config.midtransIsProduction,
  serverKey: config.midtransServerKey,
  clientKey: config.midtransClientKey,
})

const createOrder = async (
  userId: string,
  data: z.infer<typeof orderValidation.create>,
) => {
  const cart = await cartService.getCart(userId)

  if (!cart.cartItems || cart.cartItems.length === 0) {
    throw new ErrorResponse("Keranjang belanja kosong", 400)
  }

  const totalAmount = cart.cartItems.reduce((acc, item) => {
    return acc + item.quantity * item.product.price
  }, 0)

  // Calculate total weight from cart items
  const totalWeight = cart.cartItems.reduce((acc, item) => {
    return acc + item.quantity * item.product.weight
  }, 0)

  // Fetch location names from RajaOngkir API
  let provinceName = ""
  let cityName = ""
  let districtName = ""

  try {
    const provinces = await destinationService.getProvinces()
    const province = provinces.find(
      (p: { id: number; name: string }) =>
        p.id === Number(data.address.provinceId),
    )
    if (!province) {
      throw new ErrorResponse("Provinsi tidak valid", 400)
    }
    provinceName = province.name

    const cities = await destinationService.getCities(data.address.provinceId)
    const city = cities.find(
      (c: { id: number; type: string; name: string }) =>
        c.id === Number(data.address.cityId),
    )
    if (!city) {
      throw new ErrorResponse("Kota tidak valid", 400)
    }
    cityName = city.type + " " + city.name

    const districts = await destinationService.getDistricts(data.address.cityId)
    const district = districts.find(
      (d: { id: number; name: string }) =>
        d.id === Number(data.address.districtId),
    )
    if (!district) {
      throw new ErrorResponse("Kecamatan tidak valid", 400)
    }
    districtName = district.name
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error
    }
    throw new ErrorResponse("Gagal mengambil data lokasi dari RajaOngkir", 500)
  }

  // Calculate shipping cost using RajaOngkir API
  let shippingCost = 0
  let courierName = ""
  let etd = ""

  try {
    const costs = await destinationService.getCosts(
      data.address.districtId,
      totalWeight,
    )

    // Find the selected courier and service
    let selectedCourier = costs.find(
      (c: {
        name: string
        code: string
        service: string
        cost: number
        etd: string
      }) =>
        c.code === data.courierCode.toLowerCase() &&
        c.service === data.courierService,
    )
    if (!selectedCourier) {
      throw new ErrorResponse("Kurir tidak valid atau tidak tersedia", 400)
    }
    courierName = selectedCourier.name
    shippingCost = selectedCourier.cost
    etd = selectedCourier.etd
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error
    }
    throw new ErrorResponse("Gagal menghitung ongkos kirim", 500)
  }

  const totalPayment = totalAmount + shippingCost
  const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`

  const order = await prisma.$transaction(async (tx) => {
    const newAddress = await tx.address.create({
      data: {
        userId,
        customerName: data.address.customerName,
        whatsappNumber: data.address.whatsappNumber,
        provinceName,
        provinceId: data.address.provinceId,
        cityName,
        cityId: data.address.cityId,
        districtName,
        districtId: data.address.districtId,
        postalCode: data.address.postalCode,
        addressDetail: data.address.addressDetail,
      },
    })

    const newOrder = await tx.order.create({
      data: {
        userId,
        addressId: newAddress.id,
        invoiceNumber,
        status: EnumOrderStatus.PENDING,
        totalAmount,
        shippingCost,
        totalPayment,
        courierName,
        courierCode: data.courierCode,
        courierService: data.courierService,
        etd,
        orderItems: {
          create: cart.cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.price,
            subtotal: item.quantity * item.product.price,
          })),
        },
      },
      include: {
        orderItems: {
          include: { product: true },
        },
        user: true,
        address: true,
      },
    })

    return newOrder
  })

  const parameter = {
    transaction_details: {
      order_id: order.invoiceNumber,
      gross_amount: order.totalPayment,
    },
    customer_details: {
      first_name: order.user.username,
      email: order.user.email,
    },
  }

  const transaction = await snap.createTransaction(parameter)

  return {
    order,
    paymentToken: transaction.token,
    redirectUrl: transaction.redirect_url,
  }
}

const handleWebhook = async (notificationData: any) => {
  const statusResponse =
    // @ts-ignore
    await coreApi.transaction.notification(notificationData)
  const orderId = statusResponse.order_id
  const transactionStatus = statusResponse.transaction_status
  const fraudStatus = statusResponse.fraud_status

  const order = await prisma.order.findFirst({
    where: { invoiceNumber: orderId },
  })

  if (!order) {
    return false
  }

  let newStatus = order.status

  if (transactionStatus == "capture") {
    if (fraudStatus == "challenge") {
      newStatus = EnumOrderStatus.PENDING
    } else if (fraudStatus == "accept") {
      newStatus = EnumOrderStatus.PAID
    }
  } else if (transactionStatus == "settlement") {
    newStatus = EnumOrderStatus.PAID
  } else if (
    transactionStatus == "cancel" ||
    transactionStatus == "deny" ||
    transactionStatus == "expire"
  ) {
    newStatus = EnumOrderStatus.CANCELLED
  } else if (transactionStatus == "pending") {
    newStatus = EnumOrderStatus.PENDING
  }

  if (newStatus !== order.status) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: newStatus },
    })

    if (newStatus === EnumOrderStatus.PAID) {
      try {
        await cartService.clearCart(order.userId)
      } catch (err) {
        console.error("Gagal mengosongkan keranjang:", err)
      }
    }
  }

  return true
}

const updateStatus = async (
  id: number,
  data: z.infer<typeof orderValidation.updateStatus>,
) => {
  const order = await prisma.order.findUnique({
    where: { id },
  })

  if (!order) {
    throw new ErrorResponse("Order tidak ditemukan", 404)
  }

  const currentStatus = order.status
  const nextStatus = data.status

  if (nextStatus !== EnumOrderStatus.CANCELLED) {
    const sequence: EnumOrderStatus[] = [
      EnumOrderStatus.PENDING,
      EnumOrderStatus.PAID,
      EnumOrderStatus.PROCESSING,
      EnumOrderStatus.DELIVERED,
      EnumOrderStatus.COMPLETED,
    ]

    const currentIndex = sequence.indexOf(currentStatus)
    const nextIndex = sequence.indexOf(nextStatus)

    if (nextIndex <= currentIndex || nextIndex - currentIndex !== 1) {
      throw new ErrorResponse(
        `Tidak dapat mengubah status dari ${currentStatus} ke ${nextStatus}`,
        400,
      )
    }
  }

  return await prisma.order.update({
    where: { id },
    data: {
      status: nextStatus,
      shippingNumber: data.shippingNumber || order.shippingNumber,
    },
  })
}

const getAll = async (
  userId?: string,
  filters?: z.infer<typeof orderValidation.getAllQuery>,
) => {
  const where: any = {}

  // For USER role, filter by userId
  if (userId) {
    where.userId = userId
  }

  // Apply filters for ADMIN role
  if (filters) {
    if (filters.status) {
      where.status = filters.status
    }

    if (filters.year || filters.month) {
      where.createdAt = {}
      if (filters.year) {
        const startDate = new Date(
          filters.year,
          filters.month ? filters.month - 1 : 0,
          1,
        )
        const endDate = new Date(
          filters.year,
          filters.month ? filters.month : 12,
          0,
          23,
          59,
          59,
        )
        where.createdAt.gte = startDate
        where.createdAt.lte = endDate
      }
    }
  }

  return await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      orderItems: {
        include: { product: true },
      },
      address: true,
      user: {
        select: { username: true, email: true, role: true },
      },
    },
  })
}

const getById = async (id: number, userId?: string) => {
  const where: any = { id }
  if (userId) where.userId = userId

  const order = await prisma.order.findFirst({
    where,
    include: {
      orderItems: {
        include: { product: true },
      },
      address: true,
      user: {
        select: { username: true, email: true, role: true },
      },
    },
  })

  if (!order) {
    // If userId is provided (USER role), throw forbidden error
    // Otherwise (ADMIN role), throw not found
    if (userId) {
      throw new ErrorResponse("Anda tidak memiliki akses ke pesanan ini", 403)
    }
    throw new ErrorResponse("Order tidak ditemukan", 404)
  }

  return order
}

const orderService = {
  createOrder,
  handleWebhook,
  updateStatus,
  getAll,
  getById,
}
export default orderService
