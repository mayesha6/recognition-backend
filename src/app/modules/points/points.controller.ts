import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { PointsService } from "./points.services";
import { sendResponse } from "../../utils/sendResponse";

const createTransaction = catchAsync(async (req: Request, res: Response) => {
    const transaction = await PointsService.createTransaction(req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Points transaction successful",
        data: transaction
    });
})

const getUserTransactions = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.params;
    const transactions = await PointsService.getUserTransactions(email);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User transactions fetched",
        data: transactions
    });
})

const getUserBalance = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.params;
    const balance = await PointsService.getUserBalance(email);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User balance fetched",
        data: { balance }
    });
})

export const PointsController = {
    createTransaction,
    getUserTransactions,
    getUserBalance
};