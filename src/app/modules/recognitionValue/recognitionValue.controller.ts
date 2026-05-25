import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { RecognitionValueService } from "./recognitionValue.services";

const createRecognitionValue = catchAsync(async (req: Request, res: Response) => {
  const result = await RecognitionValueService.createRecognitionValue(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Recognition Value created",
    data: result,
  });
});

const getRecognitionValues = catchAsync(async (req:Request, res:Response) => {
  const result = await RecognitionValueService.getRecognitionValues();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Recognition Values fetched",
    data: result,
  });
});

const updateRecognitionValue = catchAsync(async (req:Request, res:Response) => {
  const id = req.params.id;

  const result = await RecognitionValueService.updateRecognitionValue(id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Recognition Value updated",
    data: result,
  });
});

const deleteRecognitionValue = catchAsync(async (req:Request, res:Response) => {
  const id = req.params.id;

  await RecognitionValueService.deleteRecognitionValue(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Recognition Value deleted",
    data: null,
  });
});


export const RecognitionValueController = {
  createRecognitionValue,
  getRecognitionValues,
  updateRecognitionValue,
  deleteRecognitionValue,
};