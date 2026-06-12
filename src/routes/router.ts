import express, { Router } from "express"
import authRouter from "./authRouter"
import errorMiddleware from "../middlewares/errorMiddleware"

const router: Router = express.Router()

router.use("/auth", authRouter)

router.use(errorMiddleware)

export default router
