import { ErrorResponse } from "../utils/response"
import { z, ZodError } from "zod"
import type { ZodSchema } from "zod"

const validation = async <T>(
  request: unknown,
  schema: ZodSchema<T>,
): Promise<T> => {
  try {
    const result = schema.parse(request)
    return result
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = z.flattenError(error).fieldErrors
      throw new ErrorResponse("Validation error", 400, errors)
    }
    throw error
  }
}

export default validation
