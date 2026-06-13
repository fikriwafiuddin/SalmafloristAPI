import type { NextFunction, Request, Response } from "express"
import { ErrorResponse } from "../utils/response"

export default function errorMiddleware(
  err: ErrorResponse,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log(err)

  if (err instanceof ErrorResponse) {
    return res.status(err.status).json({
      message: err.message,
      errors: err.errors,
    })
  }

  return res.status(500).json({ message: "Internal server error", errors: {} })
}
