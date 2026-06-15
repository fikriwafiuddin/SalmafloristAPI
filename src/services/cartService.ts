import cartValidation from "../validations/cartValidation.js"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import { ErrorResponse } from "../utils/response.js"

const getOrCreateCart = async (userId: string) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      cartItems: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        cartItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })
  }

  return cart
}

const getCart = async (userId: string) => {
  return await getOrCreateCart(userId)
}

const addItem = async (userId: string, data: z.infer<typeof cartValidation.addItem>) => {
  const cart = await getOrCreateCart(userId)

  const product = await prisma.product.findUnique({
    where: { id: data.productId },
  })

  if (!product || product.deletedAt) {
    throw new ErrorResponse("Produk tidak ditemukan atau tidak tersedia", 404)
  }

  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: data.productId,
    },
  })

  if (existingItem) {
    return await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + data.quantity,
      },
      include: { product: true }
    })
  }

  return await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: data.productId,
      quantity: data.quantity,
    },
    include: { product: true }
  })
}

const updateItem = async (userId: string, cartItemId: number, data: z.infer<typeof cartValidation.updateItem>) => {
  const cart = await getOrCreateCart(userId)

  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      cartId: cart.id,
    },
  })

  if (!cartItem) {
    throw new ErrorResponse("Item tidak ditemukan di keranjang Anda", 404)
  }

  return await prisma.cartItem.update({
    where: { id: cartItem.id },
    data: {
      quantity: data.quantity,
    },
    include: { product: true }
  })
}

const removeItem = async (userId: string, cartItemId: number) => {
  const cart = await getOrCreateCart(userId)

  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      cartId: cart.id,
    },
  })

  if (!cartItem) {
    throw new ErrorResponse("Item tidak ditemukan di keranjang Anda", 404)
  }

  await prisma.cartItem.delete({
    where: { id: cartItem.id },
  })

  return true
}

const clearCart = async (userId: string) => {
  const cart = await getOrCreateCart(userId)

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  })

  return true
}

const cartService = { getCart, addItem, updateItem, removeItem, clearCart }
export default cartService
