// recognition.controller.ts
import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { RecognitionServices } from "./recognition.services";
import { sendResponse } from "../../utils/sendResponse";

const sendRecognition = catchAsync(async (req: Request, res: Response) => {
  const sender = req.user as JwtPayload;

  const result = await RecognitionServices.sendRecognition(
    sender,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Recognition sent successfully",
    data: result
  });
});

const getHistory = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  const { meta, result } = await RecognitionServices.getRecognitionHistory(
    user,
    req.query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Recognition history retrieved",
    meta,
    data: result
  });
});

const deleteRecognition = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user as JwtPayload;

  const result = await RecognitionServices.deleteRecognition(id, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Recognition deleted successfully",
    data: result
  });
});

export const RecognitionControllers = {
  sendRecognition,
  getHistory,
  deleteRecognition
};