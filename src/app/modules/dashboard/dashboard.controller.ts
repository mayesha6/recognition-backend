import { Request, Response } from "express"
import httpStatus from "http-status-codes"
import { catchAsync } from "../../utils/catchAsync"
import { sendResponse } from "../../utils/sendResponse"
import { DashboardServices } from "./dashboard.services"

const getDashboard = catchAsync(async (req: Request, res: Response) => {

  const result = await DashboardServices.getDashboard()

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Dashboard data retrieved",
    data: result
  })

})

export const DashboardController = {
  getDashboard
}