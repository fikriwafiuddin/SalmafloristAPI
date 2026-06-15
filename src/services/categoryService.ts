import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import { ErrorResponse } from "../utils/response.js"
import categoryValidation from "../validations/categoryValidation.js"

const getAll = async () => {
  return await prisma.category.findMany()
}

const getById = async (id: number) => {
  const category = await prisma.category.findUnique({
    where: { id },
  })

  if (!category) {
    throw new ErrorResponse("Kategori tidak ditemukan", 404)
  }

  return category
}

const create = async (data: z.infer<typeof categoryValidation.create>) => {
  return await prisma.category.create({
    data: {
      name: data.name,
    },
  })
}

const update = async (
  id: number,
  data: z.infer<typeof categoryValidation.update>,
) => {
  await getById(id)

  return await prisma.category.update({
    where: { id },
    data: {
      name: data.name,
    },
  })
}

const remove = async (id: number) => {
  await getById(id)

  const relatedProduct = await prisma.product.findFirst({
    where: { categoryId: id },
  })

  if (relatedProduct) {
    throw new ErrorResponse(
      "Tidak dapat menghapus kategori karena masih ada produk yang berelasi",
      400,
    )
  }

  return await prisma.category.delete({
    where: { id },
  })
}

const categoryService = { getAll, getById, create, update, remove }
export default categoryService
