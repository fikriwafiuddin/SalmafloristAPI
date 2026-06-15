import type { Response, NextFunction } from "express"
import type { AuthRequest } from "../middlewares/authMiddleware"
import validation from "../validations/validation"
import dashboardValidation from "../validations/dashboardValidation"
import dashboardService from "../services/dashboardService"

const getDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validated = await validation(req.query, dashboardValidation.getAllQuery)
    const data = await dashboardService.getDashboardData(validated.days)
    return res.status(200).json(data)
  } catch (error) {
    next(error)
  }
}

const getReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validated = await validation(req.query, dashboardValidation.getReportQuery)
    const data = await dashboardService.getReport(validated.month, validated.year)
    return res.status(200).json(data)
  } catch (error) {
    next(error)
  }
}

const dashboardController = { getDashboard, getReport }
export default dashboardController
