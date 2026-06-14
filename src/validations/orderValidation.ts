import { z } from "zod"
import { EnumOrderStatus } from "../../generated/prisma/client"

const create = z.object({
  address: z.object({
    customerName: z.string().min(1, "Nama penerima wajib diisi"),
    whatsappNumber: z.string().min(1, "Nomor HP wajib diisi"),
    provinceId: z.string().min(1, "Province ID wajib diisi"),
    cityId: z.string().min(1, "City ID wajib diisi"),
    districtId: z.string().min(1, "District ID wajib diisi"),
    postalCode: z.string().min(1, "Kode pos wajib diisi"),
    addressDetail: z.string().min(1, "Alamat lengkap wajib diisi"),
  }),
  courierCode: z.string().min(1, "Courier code wajib diisi"),
  courierService: z.string().min(1, "Courier service wajib diisi"),
})

const updateStatus = z
  .object({
    status: z.enum(EnumOrderStatus, { error: "Status tidak valid" }),
    shippingNumber: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        data.status === EnumOrderStatus.DELIVERED &&
        (!data.shippingNumber || data.shippingNumber.trim() === "")
      ) {
        return false
      }
      return true
    },
    {
      message:
        "Shipping number (resi) wajib diisi saat status diubah menjadi DELIVERED",
      path: ["shippingNumber"],
    },
  )

const getAllQuery = z.object({
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  status: z.enum(EnumOrderStatus).optional(),
})

const orderValidation = { create, updateStatus, getAllQuery }
export default orderValidation
