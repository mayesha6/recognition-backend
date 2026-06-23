import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { DepartmentService } from "./department.services";

const createDepartment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await DepartmentService.createDepartment(req.body, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Department created successfully",
    data: result,
  });
});

const getDepartments = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await DepartmentService.getDepartments(user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Departments fetched successfully",
    data: result,
  });
});

const updateDepartment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = req.user as JwtPayload;

  const result = await DepartmentService.updateDepartment(id, req.body, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Department updated successfully",
    data: result,
  });
});

const deleteDepartment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = req.user as JwtPayload;

  await DepartmentService.deleteDepartment(id, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Department deleted successfully",
    data: null,
  });
});

export const DepartmentController = {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
};