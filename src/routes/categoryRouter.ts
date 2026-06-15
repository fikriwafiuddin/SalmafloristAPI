import express, { Router } from "express"
import categoryController from "../controllers/categoryController.js"
import { authenticate, authorize } from "../middlewares/authMiddleware.js"

const router: Router = express.Router()

router.get("/", categoryController.getAll)
router.get("/:id", categoryController.getById)
router.post("/", authenticate, authorize("ADMIN"), categoryController.create)
router.put("/:id", authenticate, authorize("ADMIN"), categoryController.update)
router.delete("/:id", authenticate, authorize("ADMIN"), categoryController.remove)

export default router
