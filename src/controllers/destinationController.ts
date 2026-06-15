import type { Request, Response, NextFunction } from "express"
import destinationService from "../services/destinationService.js"

const getProvinces = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const provinces = await destinationService.getProvinces()
    return res.status(200).json({ provinces })
  } catch (error) {
    next(error)
  }
}

const getCities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { province } = req.query
    const cities = await destinationService.getCities(province as string)
    return res.status(200).json({ cities })
  } catch (error) {
    next(error)
  }
}

const getDistricts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { city } = req.query
    const districts = await destinationService.getDistricts(city as string)
    return res.status(200).json({ districts })
  } catch (error) {
    next(error)
  }
}

const getCosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { destination, weight } = req.query
    const costs = await destinationService.getCosts(
      destination as string,
      Number(weight),
    )
    return res.status(200).json({ costs })
  } catch (error) {
    next(error)
  }
}

const destinationController = {
  getProvinces,
  getCities,
  getDistricts,
  getCosts,
}
export default destinationController
