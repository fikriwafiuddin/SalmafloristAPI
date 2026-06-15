import express, { Router } from "express"
import orderController from "../controllers/orderController.js"
import { authenticate, authorize } from "../middlewares/authMiddleware.js"

const router: Router = express.Router()

// Webhook endpoint (Public)
router.post("/midtrans-webhook", orderController.handleWebhook)

// Protected endpoints
router.use(authenticate)

// Checkout (USER)
router.post("/", authorize("USER"), orderController.create)

// View orders (USER / ADMIN)
router.get("/", orderController.getAll)
router.get("/:id", orderController.getById)

// Update Status (ADMIN)
router.put("/:id/status", authorize("ADMIN"), orderController.updateStatus)

export default router
