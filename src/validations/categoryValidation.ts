import { z } from "zod"

const create = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
})

const update = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
})

const categoryValidation = { create, update }
export default categoryValidation
