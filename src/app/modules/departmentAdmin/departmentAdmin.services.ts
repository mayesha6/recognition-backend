import { DeptAdmin } from "./departmentAdmin.model";
import { User } from "../user/user.model";
import { Wallet } from "../wallet/wallet.model";
import { getCurrentQuarter } from "../../utils/wallet";
import { Role } from "../user/user.interface";
import mongoose from "mongoose";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status-codes";

const createDeptAdmin = async (payload: any, decodedToken: any) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const orgId = decodedToken.userId;

    // ১. User তৈরি
    const user = await User.create([{ ...payload, role: Role.DEPARTMENT_ADMIN, organizationId: orgId }], { session });
    
    // ২. DeptAdmin রেফারেন্স তৈরি
    const deptAdmin = await DeptAdmin.create([{
        user: user[0]._id,
        department: payload.department,
        organizationId: orgId,
        assignedBudget: payload.assignedBudget
    }], { session });

    // ৩. ওয়ালেট বাজেট ইনিশিয়েট
    const { year, quarter } = getCurrentQuarter();
    await Wallet.create([{
        user: user[0]._id,
        organizationId: orgId,
        year, quarter,
        pointsAllocated: payload.assignedBudget,
        pointsBalance: payload.assignedBudget
    }], { session });

    await session.commitTransaction();
    return deptAdmin[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }
};

const getAllDeptAdmins = async (decodedToken: any) => {
  return await DeptAdmin.find({ organizationId: decodedToken.userId }).populate("user");
};

const updateDeptAdmin = async (id: string, payload: any, decodedToken: any) => {
  const result = await DeptAdmin.findOneAndUpdate(
    { _id: id, organizationId: decodedToken.userId }, // latest update: Isolation
    payload,
    { new: true }
  );
  if (!result) throw new AppError(httpStatus.NOT_FOUND, "Dept Admin not found");
  return result;
};

const deleteDeptAdmin = async (id: string, decodedToken: any) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    
    // latest update: find and delete from DeptAdmin
    const deptAdmin = await DeptAdmin.findOneAndDelete({ _id: id, organizationId: decodedToken.userId }, { session });
    if (!deptAdmin) throw new AppError(httpStatus.NOT_FOUND, "Dept Admin not found");

    // ইউজারকেও ডিলিট করা (যদি প্রয়োজনীয় হয়)
    await User.findByIdAndDelete(deptAdmin.user, { session });

    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const DeptAdminServices = { 
    createDeptAdmin, 
    getAllDeptAdmins, 
    updateDeptAdmin, 
    deleteDeptAdmin  
};

