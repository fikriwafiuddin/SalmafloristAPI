import type { Request, Response, NextFunction } from "express"
import { AuthRequest } from "../middlewares/authMiddleware.js"
import notificationService from "../services/notificationService.js"
import { ErrorResponse } from "../utils/response.js"
import validation from "../validations/validation.js"
import { notificationValidation } from "../validations/notificationValidation.js"

const registerToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validated = await validation(req.body, notificationValidation.registerToken)
    const result = await notificationService.registerToken(
      req.user!.id,
      validated.token,
      validated.deviceInfo,
    )
    return res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

const removeToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validated = await validation(req.body, notificationValidation.removeToken)
    const result = await notificationService.removeToken(validated.token)
    return res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

const notificationController = { registerToken, removeToken }
export default notificationController
