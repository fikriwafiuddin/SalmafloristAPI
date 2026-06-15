import type { Request, Response, NextFunction } from "express"
import { verifyToken } from "../lib/jwt.js"
import { prisma } from "../lib/prisma.js"
import { EnumRole } from "../../generated/prisma/client.js"

export interface AuthRequest extends Request {
  user?: any
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Unauthorized: No token provided" })
      return
    }

    const token = authHeader.split(" ")[1]
    if (!token) {
      res.status(401).json({ message: "Unauthorized: Invalid token" })
      return
    }

    const decoded = verifyToken(token) as { id: string }
    if (!decoded.id) {
      res.status(401).json({ message: "Unauthorized: Invalid token" })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    })

    if (!user) {
      res.status(401).json({ message: "Unauthorized: User not found" })
      return
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: "Unauthorized: Invalid token" })
  }
}

export const authorize = (...roles: EnumRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized: User not authenticated" })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        message: "Forbidden: You don't have permission to perform this action",
      })
      return
    }

    next()
  }
}
