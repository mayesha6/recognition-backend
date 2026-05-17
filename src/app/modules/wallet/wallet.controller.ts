import { NextFunction, Request, Response } from "express"
import { catchAsync } from "../../utils/catchAsync"
import { sendResponse } from "../../utils/sendResponse"
import httpStatus from "http-status-codes";
import { WalletServices } from "./wallet.services";
import { JwtPayload } from "jsonwebtoken";

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

  const department =
    decoded.role === "ADMIN" || decoded.role === "SUPER_ADMIN"
      ? decoded.department
      : req.body.department; // 👈 allow manual input

  console.log("FINAL DEPARTMENT:", department);

  await WalletServices.resetPoints(department);

  sendResponse(res, {
    success: true,
    statusCode: 200,
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