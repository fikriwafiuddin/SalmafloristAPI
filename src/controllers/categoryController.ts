import type { Request, Response, NextFunction } from "express"
import validation from "../validations/validation"
import categoryService from "../services/categoryService"
import categoryValidation from "../validations/categoryValidation"

const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryService.getAll()
    return res.status(200).json({ categories })
  } catch (error) {
    next(error)
  }
}

const getById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" })
    }
    const category = await categoryService.getById(id)
    return res.status(200).json({ category })
  } catch (error) {
    next(error)
  }
}

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = await validation(req.body, categoryValidation.create)
    const category = await categoryService.create(validated)
    return res.status(201).json({ category })
  } catch (error) {
    next(error)
  }
}

const update = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" })
    }
    const validated = await validation(req.body, categoryValidation.update)
    const category = await categoryService.update(id, validated)
    return res.status(200).json({ category })
  } catch (error) {
    next(error)
  }
}

const remove = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" })
    }
    await categoryService.remove(id)
    return res.status(200).json({ message: "Kategori berhasil dihapus" })
  } catch (error) {
    next(error)
  }
}

const categoryController = { getAll, getById, create, update, remove }
export default categoryController
