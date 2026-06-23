import type { NextFunction, Request, Response } from "express";
import { PlanServices } from "./plan.services";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";



const createPlan = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const plan = await PlanServices.createPlan(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Plan created successfully",
    data: plan,
  });
})

const getAllPlans = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const plans = await PlanServices.getAllPlans();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All plans fetched successfully",
    data: plans,
  });
})

const getPlanById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const plan = await PlanServices.getPlanById(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Plan fetched successfully",
    data: plan,
  });
})

const updatePlan = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const plan = await PlanServices.updatePlan(req.params.id as string, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Plan updated successfully",
    data: plan,
  });
})

const deletePlan = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  await PlanServices.deletePlan(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Plan deleted successfully",
    data: null
  });
})

export const PlanControllers = {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan
};