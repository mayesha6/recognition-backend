import { JwtPayload } from "jsonwebtoken";
import { getCurrentQuarter } from "../../utils/wallet";
import { User } from "../user/user.model";
import { Wallet } from "./wallet.model";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status-codes";
import mongoose from "mongoose";
import { Role, AccountType } from "../user/user.interface";

// ==========================================
// 🛡️ HELPER: Deduct Points from Sender
// ==========================================
const deductSenderPoints = async (
  senderToken: JwtPayload,
  totalPointsRequired: number,
  session: mongoose.ClientSession,
  year: number,
  quarter: number
) => {
  // Super Admin has infinite points
  if (senderToken.role === Role.SUPER_ADMIN) return;

  const senderWallet = await Wallet.findOne({
    user: senderToken.userId,
    year,
    quarter,
  }).session(session);

  if (!senderWallet || senderWallet.pointsBalance < totalPointsRequired) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Insufficient points. You need ${totalPointsRequired} points, but your balance is ${senderWallet?.pointsBalance || 0}.`
    );
  }

  senderWallet.pointsBalance -= totalPointsRequired;
  senderWallet.pointsUsed += totalPointsRequired;
  await senderWallet.save({ session });
};

// ==========================================
// 🚀 SERVICES
// ==========================================
const getWallet = async (userId: string, year: number, quarter: number) => {
  return await Wallet.findOne({ user: userId, year, quarter });
};

const distributePoints = async (
  department: string,
  points: number,
  decodedToken: JwtPayload
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { year, quarter } = getCurrentQuarter();
    const orgId = new mongoose.Types.ObjectId(decodedToken.organizationId || decodedToken.userId);
    const query: any = { department, isDeleted: false };

    // 🔐 ISOLATION LOGIC
    if (decodedToken.role === Role.SUPER_ADMIN) {
      // SA only distributes to Individual Accounts
      query.accountType = AccountType.INDIVIDUAL;
    } else if (decodedToken.role === Role.ORGANIZATION_ADMIN) {
      // OA only distributes to their own organization
      query.organizationId = decodedToken.userId;
    } else if (decodedToken.role === Role.DEPARTMENT_ADMIN) {
      // DA only distributes to their own org AND own department
      if (department !== decodedToken.department) {
        throw new AppError(httpStatus.FORBIDDEN, "You can only distribute points to your own department.");
      }
      query.organizationId = decodedToken.organizationId;
    }

    const users = await User.find(query).select("_id").session(session);

    if (users.length === 0) {
      throw new AppError(httpStatus.NOT_FOUND, "No valid users found in this department to distribute points.");
    }

    // 💰 CALCULATE AND DEDUCT POINTS
    const totalPointsNeeded = points * users.length;
    await deductSenderPoints(decodedToken, totalPointsNeeded, session, year, quarter);

    // 🔄 BULK UPDATE RECEIVERS
    const operations = users.map((user) => ({
      updateOne: {
        filter: { user: user._id, year, quarter },
        update: {
          $inc: {
            pointsAllocated: points,
            pointsBalance: points,
          },
          $set: { organizationId: orgId },
          $setOnInsert: { pointsUsed: 0 },
        },
        upsert: true,
      },
    }));

    await Wallet.bulkWrite(operations, { session });

    await session.commitTransaction();
    return { distributedTo: users.length, totalPointsDeducted: totalPointsNeeded };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const setUserPoints = async (
  email: string,
  points: number, // Points to ADD to the user
  decodedToken: JwtPayload
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const { year, quarter } = getCurrentQuarter();
    const orgId = new mongoose.Types.ObjectId(decodedToken.organizationId || decodedToken.userId);

    const user = await User.findOne({ email, isDeleted: false }).session(session);
    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

    // 🔐 ISOLATION LOGIC
    if (decodedToken.role === Role.SUPER_ADMIN) {
      if (user.accountType !== AccountType.INDIVIDUAL) {
        throw new AppError(httpStatus.FORBIDDEN, "Super Admin can only distribute points to Individual accounts.");
      }
    } else if (decodedToken.role === Role.ORGANIZATION_ADMIN) {
      const targetOrgId = user.organizationId?.toString() || user._id.toString();
      if (targetOrgId !== decodedToken.userId) {
        throw new AppError(httpStatus.FORBIDDEN, "User does not belong to your organization.");
      }
    } else if (decodedToken.role === Role.DEPARTMENT_ADMIN) {
      const targetOrgId = user.organizationId?.toString();
      if (targetOrgId !== decodedToken.organizationId || user.department !== decodedToken.department) {
        throw new AppError(httpStatus.FORBIDDEN, "User does not belong to your department.");
      }
    }

    // 💰 DEDUCT FROM SENDER
    await deductSenderPoints(decodedToken, points, session, year, quarter);

    // 🔄 ADD TO RECEIVER (Using $inc to properly mathematically add the points)
    await Wallet.updateOne(
      { user: user._id, year, quarter },
      {
        $inc: {
          pointsAllocated: points,
          pointsBalance: points,
        },
        $set: { organizationId: orgId },
        $setOnInsert: { pointsUsed: 0 },
      },
      { upsert: true, session }
    );

    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const resetPoints = async (department: string | undefined, decodedToken: JwtPayload) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const { year, quarter } = getCurrentQuarter();

    // latest update: Unified query construction
    const userQuery: any = { isDeleted: false };
    let walletOrgId: mongoose.Types.ObjectId;

    // 🔐 ISOLATION & AUTHORIZATION LOGIC
    if (decodedToken.role === Role.SUPER_ADMIN) {
      userQuery.accountType = AccountType.INDIVIDUAL;
      if (department) userQuery.department = department;
      // Super Admin এর ক্ষেত্রে orgId null হতে পারে বা নির্দিষ্ট হতে পারে
      walletOrgId = new mongoose.Types.ObjectId(decodedToken.userId); 
    } else if (decodedToken.role === Role.ORGANIZATION_ADMIN) {
      userQuery.organizationId = decodedToken.userId;
      walletOrgId = new mongoose.Types.ObjectId(decodedToken.userId);
      if (department) userQuery.department = department;
    } else {
      throw new AppError(httpStatus.FORBIDDEN, "You do not have permission to reset points.");
    }

    const users = await User.find(userQuery).select("_id").session(session);
    if (users.length === 0) {
      throw new AppError(httpStatus.NOT_FOUND, "No users found matching the criteria.");
    }

    const userIds = users.map((u) => u._id);

    // latest update: Added organizationId filter in updateMany for strict isolation
    const result = await Wallet.updateMany(
      { 
        user: { $in: userIds }, 
        organizationId: walletOrgId, // Strict isolation
        year, 
        quarter 
      },
      {
        $set: {
          pointsAllocated: 0,
          pointsBalance: 0,
          pointsUsed: 0,
        },
      },
      { session }
    );

    await session.commitTransaction();
    return { resetCount: result.modifiedCount };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// wallet.services.ts

const updateDepartmentBudget = async (deptAdminId: string, additionalPoints: number, decodedToken: JwtPayload) => {
    // latest update: Org Admin চাইলে বাজেট আপডেট করতে পারবে
    const { year, quarter } = getCurrentQuarter();

    const deptAdmin = await User.findOne({ _id: deptAdminId, isDeleted: false });
    if (!deptAdmin || (deptAdmin.organizationId?.toString() || deptAdmin._id.toString()) !== decodedToken.userId) {
        throw new AppError(httpStatus.FORBIDDEN, "Department admin does not belong to your organization.");
    }
    
    const wallet = await Wallet.findOneAndUpdate(
        { user: deptAdminId, year, quarter },
        { 
            $inc: { 
                pointsAllocated: additionalPoints, 
                pointsBalance: additionalPoints 
            },
            $set: { organizationId: new mongoose.Types.ObjectId(decodedToken.userId) }
        },
        { new: true }
    );
    
    if (!wallet) throw new AppError(httpStatus.NOT_FOUND, "Department admin wallet not found");
    return wallet;
};

export const WalletServices = {
  getWallet,
  distributePoints,
  resetPoints,
  setUserPoints,
  updateDepartmentBudget
};