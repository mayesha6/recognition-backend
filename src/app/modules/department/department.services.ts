import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { JwtPayload } from "jsonwebtoken";
import { Role } from "../user/user.interface";
import { Department } from "./department.model";

const createDepartment = async (payload: any, user: JwtPayload) => {
  let organizationId = null;

  if (user.role === Role.ORGANIZATION_ADMIN) {
    organizationId = user.userId;
  }

  // Prevent creating duplicate departments within the same organization context
  const existingDepartment = await Department.findOne({ name: payload.name, organizationId });
  if (existingDepartment) {
    throw new AppError(httpStatus.BAD_REQUEST, "Department with this name already exists");
  }

  const department = await Department.create({
    ...payload,
    organizationId,
    createdBy: user.userId,
  });

  return department;
};

const getDepartments = async (user: JwtPayload) => {
  const filter: any = {};

  if (user.role === Role.SUPER_ADMIN) {
    // Super Admin sees global individual tones by default, or all if needed.
    // For this use case, let's return only global tones.
    filter.organizationId = null;
  } else if (user.role === Role.ORGANIZATION_ADMIN) {
    filter.$or = [{ organizationId: null }, { organizationId: user.userId }];
  } else {
    filter.$or = [{ organizationId: null }, { organizationId: user.organizationId }];
  }

  return await Department.find(filter).sort({ createdAt: -1 });
};

const updateDepartment = async (id: string, payload: any, user: JwtPayload) => {
  const department = await Department.findById(id);

  if (!department) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

  // Isolation check: Ensure user can only update their own level's department
  if (user.role === Role.SUPER_ADMIN && department.organizationId !== null) {
    throw new AppError(httpStatus.FORBIDDEN, "Super Admin can only modify global departments");
  }

  if (user.role === Role.ORGANIZATION_ADMIN) {
    if (!department.organizationId || department.organizationId.toString() !== user.userId) {
      throw new AppError(httpStatus.FORBIDDEN, "You cannot modify this department");
    }
  }

  const updatedDepartment = await Department.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return updatedDepartment;
};

const deleteDepartment = async (id: string, user: JwtPayload) => {
  const department = await Department.findById(id);

  if (!department) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

  // Isolation check: Ensure user can only delete their own level's department
  if (user.role === Role.SUPER_ADMIN && department.organizationId !== null) {
    throw new AppError(httpStatus.FORBIDDEN, "Super Admin can only delete global departments");
  }

  if (user.role === Role.ORGANIZATION_ADMIN) {
    if (!department.organizationId || department.organizationId.toString() !== user.userId) {
      throw new AppError(httpStatus.FORBIDDEN, "You cannot delete this department");
    }
  }

  await Department.findByIdAndDelete(id);

  return department;
};

export const DepartmentService = {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
};