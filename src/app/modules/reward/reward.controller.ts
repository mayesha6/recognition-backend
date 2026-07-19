import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { RewardServices } from "./reward.services";

const createReward = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const file = (req.files as Express.MulterS3.File[])?.[0];
  const payload = { ...req.body };
  if (file) {
    payload.image = file.location;
  }
  const result = await RewardServices.createReward(payload, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Reward created successfully",
    data: result,
  });
});

const getAllRewards = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { data, meta } = await RewardServices.getAllRewards(user, req.query as Record<string, string>);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rewards retrieved successfully",
    meta,
    data,
  });
});

const updateReward = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const id = req.params.id;
  const file = (req.files as Express.MulterS3.File[])?.[0];
  const payload = { ...req.body };
  if (file) {
    payload.image = file.location;
  }
  const result = await RewardServices.updateReward(id, payload, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Reward updated successfully",
    data: result,
  });
});

const deleteReward = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const id = req.params.id;
  await RewardServices.deleteReward(id, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Reward deleted successfully",
    data: null,
  });
});

export const RewardControllers = {
  createReward,
  getAllRewards,
  updateReward,
  deleteReward,
};