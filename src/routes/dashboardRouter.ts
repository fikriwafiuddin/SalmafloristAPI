import express, { Router } from "express"
import dashboardController from "../controllers/dashboardController.js"
import { authenticate, authorize } from "../middlewares/authMiddleware.js"

const router: Router = express.Router()

// All dashboard endpoints require authentication and ADMIN role
router.use(authenticate)
router.use(authorize("ADMIN"))

// Get dashboard data
router.get("/", dashboardController.getDashboard)

// Get monthly report
router.get("/report", dashboardController.getReport)

export default router
