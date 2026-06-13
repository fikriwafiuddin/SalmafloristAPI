import type { Response, NextFunction } from "express"
import type { AuthRequest } from "../middlewares/authMiddleware"
import validation from "../validations/validation"
import cartValidation from "../validations/cartValidation"
import cartService from "../services/cartService"

const getCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id
    const cart = await cartService.getCart(userId)
    return res.status(200).json({ cart })
  } catch (error) {
    next(error)
  }
}

const addItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id
    const validated = await validation(req.body, cartValidation.addItem)
    const cartItem = await cartService.addItem(userId, validated)
    return res.status(201).json({ cartItem })
  } catch (error) {
    next(error)
  }
}

const updateItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user.id
    const itemId = parseInt(req.params.itemId as string)
    if (isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid Item ID" })
    }
    const validated = await validation(req.body, cartValidation.updateItem)
    const cartItem = await cartService.updateItem(userId, itemId, validated)
    return res.status(200).json({ cartItem })
  } catch (error) {
    next(error)
  }
}

const removeItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user.id
    const itemId = parseInt(req.params.itemId as string)
    if (isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid Item ID" })
    }
    await cartService.removeItem(userId, itemId)
    return res
      .status(200)
      .json({ message: "Item berhasil dihapus dari keranjang" })
  } catch (error) {
    next(error)
  }
}

const clearCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user.id
    await cartService.clearCart(userId)
    return res.status(200).json({ message: "Keranjang berhasil dikosongkan" })
  } catch (error) {
    next(error)
  }
}

const cartController = { getCart, addItem, updateItem, removeItem, clearCart }
export default cartController
