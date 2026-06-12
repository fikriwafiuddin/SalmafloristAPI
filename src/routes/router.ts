import express, { Router } from "express"
import authRouter from "./authRouter"
import categoryRouter from "./categoryRouter"
import errorMiddleware from "../middlewares/errorMiddleware"

const router: Router = express.Router()

router.use("/auth", authRouter)
router.use("/categories", categoryRouter)

router.use(errorMiddleware)

export default router
