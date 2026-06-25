import { Request, Response } from "express"
import httpStatus from "http-status-codes"
import { catchAsync } from "../../utils/catchAsync"
import { sendResponse } from "../../utils/sendResponse"
import { DashboardServices } from "./dashboard.services"
import { JwtPayload } from "jsonwebtoken"

const getDashboard = catchAsync(async (req: Request, res: Response) => {

  const result = await DashboardServices.getDashboard()

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Dashboard data retrieved",
    data: result
  })

})

const getReports = catchAsync(async (req, res) => {

  const { startDate, endDate, department } = req.query

  const result = await DashboardServices.getReports({
    startDate,
    endDate,
    department
  })
console.log("Reports result:", result)
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Reports fetched",
    data: result
  })
})

const getOrgDashboard = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.user as JwtPayload;
  const userId = userToken.userId;
  const result = await DashboardServices.getOrgDashboard(userId);
  
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Organization dashboard data retrieved",
    data: result
  });
});

export const DashboardController = {
  getDashboard,
  getReports,
  getOrgDashboard
}