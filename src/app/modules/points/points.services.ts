import { PointsTransaction } from "./points.model";
import { User } from "../user/user.model";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status-codes";
import { Wallet } from "../wallet/wallet.model";
import { getCurrentQuarter } from "../../utils/wallet";
import { JwtPayload } from "jsonwebtoken";
import { Role } from "../user/user.interface";

// 🛡️ Helper: Data Isolation Checker
const verifyUserAccess = async (targetEmail: string, requester: JwtPayload) => {
  const targetUser = await User.findOne({ email: targetEmail });
  if (!targetUser) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  // If user is checking their own profile, allow
  if (requester.email === targetEmail) return targetUser;

  if (requester.role !== Role.SUPER_ADMIN) {
    const targetOrgId = targetUser.organizationId?.toString() || targetUser._id.toString();
    const requesterOrgId = requester.role === Role.ORGANIZATION_ADMIN 
      ? requester.userId 
      : requester.organizationId;

    if (targetOrgId !== requesterOrgId) {
      throw new AppError(httpStatus.FORBIDDEN, "Not authorized to view data from another organization");
    }

    if (requester.role === Role.DEPARTMENT_ADMIN) {
      if (targetUser.department !== requester.department) {
        throw new AppError(httpStatus.FORBIDDEN, "Not authorized to view data outside your department");
      }
    }
    
    // Regular users shouldn't check other users' balances directly unless it's a specific feature
    if (requester.role === Role.USER) {
        throw new AppError(httpStatus.FORBIDDEN, "Users can only view their own balance/transactions");
    }
  }

  return targetUser;
};

// ==========================================

const getUserTransactions = async (email: string, decodedToken: JwtPayload) => {
  // ১. সিকিউরিটি চেক
  await verifyUserAccess(email, decodedToken);

  // ২. ডাটা ফেচ
  return await PointsTransaction.find({
    $or: [{ senderEmail: email }, { receiverEmail: email }]
  }).sort({ createdAt: -1 });
}

const getUserBalance = async (email: string, decodedToken: JwtPayload) => {
  // ১. সিকিউরিটি চেক
  const targetUser = await verifyUserAccess(email, decodedToken);

  // ২. ব্যালেন্স ফেচ
  const { year, quarter } = getCurrentQuarter();

  const wallet = await Wallet.findOne({
    user: targetUser._id,
    year,
    quarter
  });

  if (!wallet) {
    // Return 0 instead of throwing an error if the wallet doesn't exist yet
    return 0; 
  }

  return wallet.pointsBalance;
}

export const PointsService = {
  getUserTransactions,
  getUserBalance
};