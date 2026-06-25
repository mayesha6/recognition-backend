import { DeptAdmin } from "./departmentAdmin.model";
import { User } from "../user/user.model";
import { Wallet } from "../wallet/wallet.model";
import { getCurrentQuarter } from "../../utils/wallet";
import { Role } from "../user/user.interface";
import mongoose from "mongoose";

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

export const DeptAdminServices = { 
    createDeptAdmin, 
    getAllDeptAdmins 
};