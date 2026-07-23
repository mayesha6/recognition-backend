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

  if (payload.adminId) {
    // 1. Clear any other department admin that is currently assigned to this department name
    await User.updateMany(
      { organizationId, role: Role.DEPARTMENT_ADMIN, department: department.name },
      { $set: { department: "" } }
    );
    // 2. Assign the new admin to this department
    await User.findByIdAndUpdate(payload.adminId, { department: department.name });
  }

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

      // Get all user emails in this department
      const usersInDept = await User.find(employeeFilter).select("email").lean();
      const userEmails = usersInDept.map((u: any) => u.email);

      // Count recognitions sent by users of this department
      const recognitions = await Recognition.countDocuments({
        senderEmail: { $in: userEmails }
      });

      return {
        ...dept,
        id: dept._id.toString(),
        admin: adminUser ? adminUser.name : "N/A",
        adminEmail: adminUser ? adminUser.email : "",
        adminId: adminUser ? adminUser._id.toString() : "",
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
    if (!department.organizationId || department.organizationId.toString() !== user.userId.toString()) {
      throw new AppError(httpStatus.FORBIDDEN, "You cannot modify this department");
    }
  }

  const oldName = department.name;
  const newName = payload.name || oldName;

  const updatedDepartment = await Department.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (updatedDepartment) {
    const orgId = department.organizationId;

    // 1. If department name changed, update all users (regular and admins) in this department
    if (oldName !== newName) {
      await User.updateMany(
        { organizationId: orgId, department: oldName },
        { $set: { department: newName } }
      );
    }

    // 2. Handle admin assignment if adminId is passed
    if (payload.adminId) {
      // Clear any other admin of this department
      await User.updateMany(
        { organizationId: orgId, role: Role.DEPARTMENT_ADMIN, department: newName },
        { $set: { department: "" } }
      );
      // Assign the new admin
      await User.findByIdAndUpdate(payload.adminId, { department: newName });
    } else if (payload.adminId === "") {
      // If adminId is explicitly cleared, remove the admin
      await User.updateMany(
        { organizationId: orgId, role: Role.DEPARTMENT_ADMIN, department: newName },
        { $set: { department: "" } }
      );
    }
  }

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
    if (!department.organizationId || department.organizationId.toString() !== user.userId.toString()) {
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