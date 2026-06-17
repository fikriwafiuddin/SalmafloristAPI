import express, { type Router } from "express"
import notificationController from "../controllers/notificationController.js"
import { authenticate } from "../middlewares/authMiddleware.js"

const router: Router = express.Router()

// All routes require authentication
router.use(authenticate)

// Register FCM token
router.post("/token", notificationController.registerToken)

// Remove FCM token
router.delete("/token", notificationController.removeToken)

export default router
