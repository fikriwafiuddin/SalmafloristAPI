import { z } from "zod"

const getAllQuery = z.object({
  days: z.coerce.number().int().min(1).max(30).optional().default(7),
})

const getReportQuery = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
})

const dashboardValidation = { getAllQuery, getReportQuery }
export default dashboardValidation
