import { z } from "zod"

const login = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const register = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
})

const authValidation = { login, register }
export { authValidation }
