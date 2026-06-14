import type { Request, Response, NextFunction } from "express"
import type { AuthRequest } from "../middlewares/authMiddleware"
import validation from "../validations/validation"
import orderValidation from "../validations/orderValidation"
import orderService from "../services/orderService"

const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id
    const validated = await validation(req.body, orderValidation.create)
    const result = await orderService.createOrder(userId, validated)
    return res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await orderService.handleWebhook(req.body)
    return res.status(200).json({ message: "OK" })
  } catch (error) {
    next(error)
  }
}

const updateStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseInt(req.params.id as string)
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid Order ID" })
    }
    const validated = await validation(req.body, orderValidation.updateStatus)
    const order = await orderService.updateStatus(id, validated)
    return res.status(200).json({ order })
  } catch (error) {
    next(error)
  }
}

const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.role === "USER" ? req.user.id : undefined
    const filters = req.user.role === "ADMIN"
      ? await validation(req.query, orderValidation.getAllQuery)
      : undefined
    const orders = await orderService.getAll(userId, filters)
    return res.status(200).json({ orders })
  } catch (error) {
    next(error)
  }
}

const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string)
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid Order ID" })
    }
    const userId = req.user.role === "USER" ? req.user.id : undefined
    const order = await orderService.getById(id, userId)
    return res.status(200).json({ order })
  } catch (error) {
    next(error)
  }
}

const orderController = { create, handleWebhook, updateStatus, getAll, getById }
export default orderController
