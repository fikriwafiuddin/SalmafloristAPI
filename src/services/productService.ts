import productValidation from "../validations/productValidation"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { ErrorResponse } from "../utils/response"
import cloudinary from "../lib/cloudinary"
import streamifier from "streamifier"

const uploadToCloudinary = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "salmaflorist/products" },
      (error, result) => {
        if (error || !result) return reject(error)
        resolve(result.secure_url)
      }
    )
    streamifier.createReadStream(buffer).pipe(uploadStream)
  })
}

const getAll = async () => {
  return await prisma.product.findMany({
    where: { deletedAt: null },
    include: { category: true }
  })
}

const getById = async (id: number) => {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: { category: true }
  })

  if (!product) {
    throw new ErrorResponse("Produk tidak ditemukan", 404)
  }

  return product
}

const create = async (data: z.infer<typeof productValidation.create>, file?: Express.Multer.File) => {
  if (!file) {
    throw new ErrorResponse("Gambar produk wajib diunggah", 400)
  }

  const imageUrl = await uploadToCloudinary(file.buffer)

  return await prisma.product.create({
    data: {
      name: data.name,
      categoryId: data.categoryId,
      price: data.price,
      description: data.description,
      image: imageUrl,
    },
  })
}

const update = async (id: number, data: z.infer<typeof productValidation.update>, file?: Express.Multer.File) => {
  const existingProduct = await getById(id)

  let imageUrl = existingProduct.image
  if (file) {
    imageUrl = await uploadToCloudinary(file.buffer)
  }

  return await prisma.product.update({
    where: { id },
    data: {
      name: data.name ?? existingProduct.name,
      categoryId: data.categoryId ?? existingProduct.categoryId,
      price: data.price ?? existingProduct.price,
      description: data.description ?? existingProduct.description,
      image: imageUrl,
    },
  })
}

const remove = async (id: number) => {
  await getById(id)

  return await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

const productService = { getAll, getById, create, update, remove }
export default productService
