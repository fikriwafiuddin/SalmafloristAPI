import { z } from "zod"

const getAllQuery = z.object({
  days: z.coerce.number().int().min(1).max(30).optional().default(7),
})

const dashboardValidation = { getAllQuery }
export default dashboardValidation
