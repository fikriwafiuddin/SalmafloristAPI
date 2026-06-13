import express, { Router } from "express"
import cartController from "../controllers/cartController"
import { authenticate, authorize } from "../middlewares/authMiddleware"

const router: Router = express.Router()

router.use(authenticate)
router.use(authorize("USER"))

router.get("/", cartController.getCart)
router.post("/", cartController.addItem)
router.put("/:itemId", cartController.updateItem)
router.delete("/:itemId", cartController.removeItem)
router.delete("/", cartController.clearCart)

export default router
