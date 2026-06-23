import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { ToneService } from "./tone.services";
import { JwtPayload } from "jsonwebtoken";

const createTone = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await ToneService.createTone(req.body, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Tone created successfully",
    data: result,
  });
});

const getTones = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await ToneService.getTones(user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tones fetched successfully",
    data: result,
  });
});

const updateTone = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = req.user as JwtPayload;

  const result = await ToneService.updateTone(id, req.body, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tone updated successfully",
    data: result,
  });
});

const deleteTone = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = req.user as JwtPayload;

  await ToneService.deleteTone(id, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tone deleted successfully",
    data: null,
  });
});

export const ToneController = {
  createTone,
  getTones,
  updateTone,
  deleteTone,
};