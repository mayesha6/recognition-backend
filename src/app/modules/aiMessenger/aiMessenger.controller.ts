import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { AiMessengerService } from "./aiMessenger.service";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";


const generate = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const userId = user.userId;

    const result = await AiMessengerService.generateMessage(
        userId,
        req.body
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Message generated successfully",
        data: result
    });
});

const regenerate = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const userId = user.userId;
    
    const result = await AiMessengerService.regenerateMessage(
        userId,
        req.body
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Message generated successfully",
        data: result
    });
});

const editMessage = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const userId = user.userId;
    
    // Extract whichever field the frontend sends
    const { messageId, newMessage, message } = req.body;
    const textToSave = newMessage || message;

    const updatedMessage = await AiMessengerService.editMessage(
        userId,
        messageId,
        textToSave
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Message updated successfully",
        data: updatedMessage
    });
});

export const AiMessengerController = {
    generate,
    regenerate,
    editMessage
};