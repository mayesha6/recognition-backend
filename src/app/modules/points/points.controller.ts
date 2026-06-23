import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { PointsService } from "./points.services";
import { sendResponse } from "../../utils/sendResponse";
import { JwtPayload } from "jsonwebtoken";

const getUserTransactions = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.params;
    const decodedToken = req.user as JwtPayload;

    const transactions = await PointsService.getUserTransactions(email, decodedToken);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User transactions fetched",
        data: transactions
    });
});

const getMyTransactions = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const transactions = await PointsService.getUserTransactions(user.email, user); // User checking their own

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Your transactions fetched",
        data: transactions
    });
});

const getUserBalance = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.params;
    const decodedToken = req.user as JwtPayload;

    const balance = await PointsService.getUserBalance(email, decodedToken);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User balance fetched",
        data: { balance }
    });
});

const getMyBalance = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const balance = await PointsService.getUserBalance(user.email, user);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Your balance fetched",
        data: { balance }
    });
});

export const PointsController = {
    getUserTransactions,
    getUserBalance,
    getMyBalance,
    getMyTransactions
};