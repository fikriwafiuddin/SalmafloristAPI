import { z } from "zod"

const registerToken = z.object({
  token: z.string().min(1),
  deviceInfo: z.string().optional(),
})

const removeToken = z.object({
  token: z.string().min(1),
})

const notificationValidation = { registerToken, removeToken }
export { notificationValidation }
