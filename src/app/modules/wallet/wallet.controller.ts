import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { WalletServices } from "./wallet.services";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/AppError";
import { Role } from "../user/user.interface";

const getWallet = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const { year, quarter } = req.body; // Consider moving year/quarter to query params for GET requests

  const wallet = await WalletServices.getWallet(userId, year, quarter);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Wallet retrieved successfully",
    data: wallet,
  });
});

const distributePoints = catchAsync(async (req: Request, res: Response) => {
  const { department, points } = req.body;
  const decodedToken = req.user as JwtPayload;

  const result = await WalletServices.distributePoints(
    department,
    points,
    decodedToken
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Points distributed successfully",
    data: result,
  });
});

const resetPoints = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const requestedDepartment = req.body.department;

  const result = await WalletServices.resetPoints(requestedDepartment, decodedToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Points reset successfully",
    data: result,
  });
});

const setUserPoints = catchAsync(async (req: Request, res: Response) => {
  const { email, points } = req.body;
  const decodedToken = req.user as JwtPayload;

  const result = await WalletServices.setUserPoints(email, points, decodedToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User points updated successfully",
    data: result,
  });
});

// wallet.controller.ts

const updateDepartmentBudget = catchAsync(async (req: Request, res: Response) => {
    const { deptAdminId, points } = req.body;
    const decodedToken = req.user as JwtPayload;

    const result = await WalletServices.updateDepartmentBudget(deptAdminId, points, decodedToken);
    
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Budget updated successfully",
        data: result
    });
});

export const WalletController = {
  getWallet,
  distributePoints,
  resetPoints,
  setUserPoints,
  updateDepartmentBudget
};