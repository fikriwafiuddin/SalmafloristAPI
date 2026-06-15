import express, { Router } from "express"
import authController from "../controllers/authController.js"

const router: Router = express.Router()

router.post("/login", authController.login)
router.post("/register", authController.register)
router.get("/verify", authController.verify)

export default router
