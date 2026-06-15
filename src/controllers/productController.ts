import type { Request, Response, NextFunction } from "express"
import validation from "../validations/validation.js"
import productValidation from "../validations/productValidation.js"
import productService from "../services/productService.js"

const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await productService.getAll()
    return res.status(200).json({ products })
  } catch (error) {
    next(error)
  }
}

const getById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" })
    }
    const product = await productService.getById(id)
    return res.status(200).json({ product })
  } catch (error) {
    next(error)
  }
}

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = await validation(req.body, productValidation.create)
    const product = await productService.create(validated, req.file)
    return res.status(201).json({ product })
  } catch (error) {
    next(error)
  }
}

const update = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" })
    }
    const validated = await validation(req.body, productValidation.update)
    const product = await productService.update(id, validated, req.file)
    return res.status(200).json({ product })
  } catch (error) {
    next(error)
  }
}

const remove = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" })
    }
    await productService.remove(id)
    return res.status(200).json({ message: "Produk berhasil dihapus" })
  } catch (error) {
    next(error)
  }
}

const productController = { getAll, getById, create, update, remove }
export default productController
