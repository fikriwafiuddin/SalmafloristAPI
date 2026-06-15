import express, { Router } from "express"
import dashboardController from "../controllers/dashboardController"
import { authenticate, authorize } from "../middlewares/authMiddleware"

const router: Router = express.Router()

// All dashboard endpoints require authentication and ADMIN role
router.use(authenticate)
router.use(authorize("ADMIN"))

// Get dashboard data
router.get("/", dashboardController.getDashboard)

export default router
