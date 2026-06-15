import express, { Router } from "express"
import productController from "../controllers/productController.js"
import { authenticate, authorize } from "../middlewares/authMiddleware.js"
import upload from "../middlewares/uploadMiddleware.js"

const router: Router = express.Router()

router.get("/", productController.getAll)
router.get("/:id", productController.getById)
router.post("/", authenticate, authorize("ADMIN"), upload.single("image"), productController.create)
router.put("/:id", authenticate, authorize("ADMIN"), upload.single("image"), productController.update)
router.delete("/:id", authenticate, authorize("ADMIN"), productController.remove)

export default router
