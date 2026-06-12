import { authValidation } from "../validations/authValidation"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { ErrorResponse } from "../utils/response"
import bcrypt from "bcrypt"
import { generateToken, verifyToken } from "../lib/jwt"
import type { JwtPayload } from "jsonwebtoken"

const login = async (data: z.infer<typeof authValidation.login>) => {
  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  })

  if (!user) {
    throw new ErrorResponse("Email atau password salah", 404)
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password)

  if (!isPasswordValid) {
    throw new ErrorResponse("Email atau password salah", 401)
  }

  const token = generateToken(user.id)

  return { user, token }
}

const register = async (data: z.infer<typeof authValidation.register>) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  })

  if (existingUser) {
    throw new ErrorResponse("Email sudah terdaftar", 409)
  }

  const hashedPassword = await bcrypt.hash(data.password, 10)

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      username: data.username,
      role: "USER",
    },
  })

  const token = generateToken(user.id)

  return { user, token }
}

const verify = async (token: string) => {
  const decodedToken = verifyToken(token)

  if (!decodedToken) {
    throw new ErrorResponse("Token tidak valid", 401)
  }

  const user = await prisma.user.findUnique({
    where: {
      id: (decodedToken as JwtPayload).id,
    },
  })

  if (!user) {
    throw new ErrorResponse("Token tidak valid", 401)
  }

  return user
}

const authService = { login, register, verify }
export default authService
