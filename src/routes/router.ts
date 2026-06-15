import express, { Router } from "express"
import authRouter from "./authRouter"
import categoryRouter from "./categoryRouter"
import productRouter from "./productRouter"
import destinationRouter from "./destinationRouter"
import cartRouter from "./cartRouter"
import orderRouter from "./orderRouter"
import dashboardRouter from "./dashboardRouter"
import errorMiddleware from "../middlewares/errorMiddleware"

const router: Router = express.Router()

router.use("/auth", authRouter)
router.use("/categories", categoryRouter)
router.use("/products", productRouter)
router.use("/destinations", destinationRouter)
router.use("/carts", cartRouter)
router.use("/orders", orderRouter)
router.use("/dashboard", dashboardRouter)

router.all(/.*/, (req, res) => {
  return res.status(404).json({ message: "Not found" })
})

router.use(errorMiddleware)

export default router
