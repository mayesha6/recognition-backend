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

import { User } from "../user/user.model";
import { Recognition } from "../recognition/recognition.model";

const getDepartments = async (user: JwtPayload) => {
  const filter: any = {};

  if (user.role === Role.SUPER_ADMIN) {
    filter.organizationId = null;
  } else {
    filter.organizationId = user.organizationId || user.userId;
  }

  const departments = await Department.find(filter).sort({ createdAt: -1 }).lean();

  const enrichedDepartments = await Promise.all(
    departments.map(async (dept: any) => {
      // Find the department admin
      const adminFilter: any = {
        department: dept.name,
        role: Role.DEPARTMENT_ADMIN
      };
      if (dept.organizationId !== null) {
        adminFilter.organizationId = dept.organizationId;
      }
      const adminUser = await User.findOne(adminFilter).lean();

      // Count employees in this department
      const employeeFilter: any = {
        department: dept.name
      };
      if (dept.organizationId !== null) {
        employeeFilter.organizationId = dept.organizationId;
      }
      const employees = await User.countDocuments(employeeFilter);

      // Count recognitions associated with this department
      const recognitionFilter: any = {
        department: dept.name
      };
      if (dept.organizationId !== null) {
        recognitionFilter.organizationId = dept.organizationId;
      }
      const recognitions = await Recognition.countDocuments(recognitionFilter);

      return {
        ...dept,
        id: dept._id.toString(),
        admin: adminUser ? adminUser.name : "N/A",
        adminEmail: adminUser ? adminUser.email : "",
        employees,
        recognitions
      };
    })
  );

  return enrichedDepartments;
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