import type { Request, Response, NextFunction } from "express"
import validation from "../validations/validation.js"
import { authValidation } from "../validations/authValidation.js"
import authService from "../services/authService.js"
import { ErrorResponse } from "../utils/response.js"

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = await validation(req.body, authValidation.login)
    const { user, token } = await authService.login(validated)

    return res.status(200).json({ user, token })
  } catch (error) {
    next(error)
  }
}

const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = await validation(req.body, authValidation.register)
    const { user, token } = await authService.register(validated)

    return res.status(201).json({ user, token })
  } catch (error) {
    next(error)
  }
}

const verify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      throw new ErrorResponse("Token is required", 400)
    }
    const user = await authService.verify(token)

    return res.status(200).json({ user })
  } catch (error) {
    next(error)
  }
}

const authController = { login, register, verify }
export default authController
