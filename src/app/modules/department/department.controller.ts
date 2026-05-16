import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { DepartmentService } from "./department.services";

const createDepartment = catchAsync(async (req: Request, res: Response) => {
  const result = await DepartmentService.createDepartment(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Department created",
    data: result,
  });
});

const getDepartments = catchAsync(async (req:Request, res:Response) => {
  const result = await DepartmentService.getDepartments();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Departments fetched",
    data: result,
  });
});

const updateDepartment = catchAsync(async (req:Request, res:Response) => {
  const id = req.params.id;

  const result = await DepartmentService.updateDepartment(id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category updated",
    data: result,
  });
});

const deleteDepartment = catchAsync(async (req:Request, res:Response) => {
  const id = req.params.id;

  await DepartmentService.deleteDepartment(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Department deleted",
    data: null,
  });
});


export const DepartmentController = {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
};