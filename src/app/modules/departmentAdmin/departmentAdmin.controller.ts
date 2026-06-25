import { catchAsync } from "../../utils/catchAsync";
import { DeptAdminServices } from "./departmentAdmin.services";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";

const createDeptAdmin = catchAsync(async (req, res) => {
  const result = await DeptAdminServices.createDeptAdmin(req.body, req.user);
  sendResponse(res, { 
    success: true, 
    statusCode: httpStatus.CREATED,
    message: "Dept Admin created", 
    data: result });
});

const getAllDeptAdmins = catchAsync(async (req, res) => {
  const result = await DeptAdminServices.getAllDeptAdmins(req.user);
  sendResponse(res, { 
    success: true, 
    statusCode: httpStatus.OK,
    message: "Dept Admins retrieved", 
    data: result });
});

export const DeptAdminControllers = { 
    createDeptAdmin, 
    getAllDeptAdmins 
};