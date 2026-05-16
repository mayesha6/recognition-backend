import httpStatus from "http-status-codes";
import { Department } from "./department.model";
import AppError from "../../errorHelpers/AppError";

const createDepartment = async (payload: any) => {
  const department = await Department.create(payload);
  return department;
};

const getDepartments = async () => {
  return await Department.find();
};

const updateDepartment = async (id: string, payload: any) => {
  const department = await Department.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!department) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

  return department;
};

const deleteDepartment = async (id: string) => {
  const department = await Department.findByIdAndDelete(id);

  if (!department) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

  return department;
};

export const DepartmentService = {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
};