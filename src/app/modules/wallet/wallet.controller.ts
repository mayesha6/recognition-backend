import { NextFunction, Request, Response } from "express"
import { catchAsync } from "../../utils/catchAsync"
import { sendResponse } from "../../utils/sendResponse"
import httpStatus from "http-status-codes";
import { WalletServices } from "./wallet.services";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/AppError";

const getWallet = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const userId = req.params.userId
    const { year, quarter } = req.body

    const wallet = await WalletServices.getWallet(userId, year, quarter)

    sendResponse(res, {

        success: true,
        statusCode: httpStatus.OK,
        message: "Wallet retrieve successfully",
        data: wallet,
    })

})

const distributePoints = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const { department, points } = req.body


    const result =
        await WalletServices.distributePoints(
            department,
            points
        )

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Points distributed",
        data: result
    })

})

const resetPoints = catchAsync(async (req, res) => {
  const decoded = req.user as JwtPayload;

  const requestedDepartment = req.body.department;

  let departmentToReset: string | undefined;

  // 🔥 SUPER ADMIN
  if (decoded.role === "SUPER_ADMIN") {
    departmentToReset = requestedDepartment; 
    // undefined হলে সব reset হবে
  }

  // 🔥 NORMAL ADMIN
  else if (decoded.role === "ADMIN") {
    if (!requestedDepartment) {
      throw new AppError(httpStatus.BAD_REQUEST, "Department is required");
    }

    if (requestedDepartment !== decoded.department) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You can only reset points for your own department"
      );
    }

    departmentToReset = decoded.department;
  }

  else {
    throw new AppError(403, "Not authorized");
  }

  await WalletServices.resetPoints(departmentToReset);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Points reset successfully",
    data: null
  });
});

const setUserPoints = catchAsync(async (req, res) => {

  const { email, points } = req.body;
  const decoded = req.user as JwtPayload;

  const result = await WalletServices.setUserPoints(
    email,
    points,
    decoded
  );

  sendResponse(res, {
    success: true,
    statusCode:  httpStatus.OK,
    message: "User points updated",
    data: result
  });
});

export const WalletController = {
    getWallet,
    distributePoints,
    resetPoints,
    setUserPoints
};