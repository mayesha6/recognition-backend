import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { ToneService } from "./tone.services";

const createTone = catchAsync(async (req: Request, res: Response) => {
  const result = await ToneService.createTone(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Tone created",
    data: result,
  });
});

const getTones = catchAsync(async (req:Request, res:Response) => {
  const result = await ToneService.getTones();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tones fetched",
    data: result,
  });
});

const updateTone = catchAsync(async (req:Request, res:Response) => {
  const id = req.params.id;

  const result = await ToneService.updateTone(id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tone updated",
    data: result,
  });
});

const deleteTone = catchAsync(async (req:Request, res:Response) => {
  const id = req.params.id;

  await ToneService.deleteTone(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tone deleted",
    data: null,
  });
});


export const ToneController = {
  createTone,
  getTones,
  updateTone,
  deleteTone,
};