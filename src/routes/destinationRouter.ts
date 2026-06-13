import express, { Router } from "express"
import destinationController from "../controllers/destinationController"

const router: Router = express.Router()

router.get("/provinces", destinationController.getProvinces)
router.get("/cities", destinationController.getCities)
router.get("/districts", destinationController.getDistricts)
router.get("/costs", destinationController.getCosts)

export default router
