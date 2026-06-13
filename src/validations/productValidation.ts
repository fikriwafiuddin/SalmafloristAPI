import { z } from "zod"

const create = z.object({
  categoryId: z.coerce.number(),
  name: z.string().min(1, "Nama produk wajib diisi"),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
})

const update = z.object({
  categoryId: z.coerce.number().optional(),
  name: z.string().min(1, "Nama produk wajib diisi").optional(),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif").optional(),
  description: z.string().min(1, "Deskripsi wajib diisi").optional(),
})

const productValidation = { create, update }
export default productValidation
