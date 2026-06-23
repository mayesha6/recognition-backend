import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { RecognitionValueService } from "./recognitionValue.services";

const createRecognitionValue = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await RecognitionValueService.createRecognitionValue(req.body, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Recognition value created successfully",
    data: result,
  });
});

const getRecognitionValues = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await RecognitionValueService.getRecognitionValues(user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Recognition values fetched successfully",
    data: result,
  });
});

const updateRecognitionValue = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = req.user as JwtPayload;

  const result = await RecognitionValueService.updateRecognitionValue(id, req.body, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Recognition value updated successfully",
    data: result,
  });
});

const deleteRecognitionValue = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = req.user as JwtPayload;

  await RecognitionValueService.deleteRecognitionValue(id, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Recognition value deleted successfully",
    data: null,
  });
});

export const RecognitionValueController = {
  createRecognitionValue,
  getRecognitionValues,
  updateRecognitionValue,
  deleteRecognitionValue,
};