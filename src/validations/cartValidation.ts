import { z } from "zod"

const addItem = z.object({
  productId: z.coerce.number().min(1, "Product ID tidak valid"),
  quantity: z.coerce.number().min(1, "Quantity minimal 1"),
})

const updateItem = z.object({
  quantity: z.coerce.number().min(1, "Quantity minimal 1"),
})

const cartValidation = { addItem, updateItem }
export default cartValidation
