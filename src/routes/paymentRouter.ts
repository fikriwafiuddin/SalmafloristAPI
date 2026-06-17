import express, { Router } from "express"
import paymentController from "../controllers/paymentController.js"

const router: Router = express.Router()

// Payment redirect pages (Public - no auth required)
// These are the redirect URLs from Midtrans Snap after payment
router.get("/success", paymentController.renderSuccessPage)
router.get("/error", paymentController.renderErrorPage)

export default router
