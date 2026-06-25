import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { RedeemServices } from "./redeem.services";

const createClaim = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await RedeemServices.createClaim(req.body.rewardId, decodedToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Reward claimed successfully",
    data: result,
  });
});

const getClaims = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const { data, meta } = await RedeemServices.getClaims(req.query as Record<string, string>, decodedToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Claims retrieved successfully",
    meta,
    data,
  });
});

const getClaimStats = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await RedeemServices.getClaimStats(decodedToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Claim stats retrieved successfully",
    data: result,
  });
});

const updateClaimStatus = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const { id } = req.params;
  const { status } = req.body;

  const result = await RedeemServices.updateClaimStatus(id, status, decodedToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `Claim ${status.toLowerCase()} successfully`,
    data: result,
  });
});

export const RedeemControllers = {
  createClaim,
  getClaims,
  getClaimStats,
  updateClaimStatus,
};