import express, { Router } from "express"
import authRouter from "./authRouter.js"
import categoryRouter from "./categoryRouter.js"
import productRouter from "./productRouter.js"
import destinationRouter from "./destinationRouter.js"
import cartRouter from "./cartRouter.js"
import orderRouter from "./orderRouter.js"
import dashboardRouter from "./dashboardRouter.js"
import errorMiddleware from "../middlewares/errorMiddleware.js"

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
