import mongoose from "mongoose";
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { RewardClaim } from "./redeem.model";
import { Reward } from "../reward/reward.model";
import { User } from "../user/user.model";
import { Wallet } from "../wallet/wallet.model";
import { PointsTransaction } from "../points/points.model";
import { getCurrentQuarter } from "../../utils/wallet";
import { QueryBuilder } from "../../utils/QueryBuiler";
import { JwtPayload } from "jsonwebtoken";
import { ClaimStatus } from "./redeem.interface";
import { Role } from "../user/user.interface";

const createClaim = async (rewardId: string, decodedToken: JwtPayload) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findById(decodedToken.userId).session(session);
    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

    const reward = await Reward.findById(rewardId).session(session);
    if (!reward) throw new AppError(httpStatus.NOT_FOUND, "Reward not found");

    if (reward.status !== "Active" || reward.stock <= 0) {
      throw new AppError(httpStatus.BAD_REQUEST, "Reward is out of stock or inactive");
    }

    const { year, quarter } = getCurrentQuarter();
    const wallet = await Wallet.findOne({ user: user._id, year, quarter }).session(session);

    if (!wallet || wallet.pointsBalance < reward.points) {
      throw new AppError(httpStatus.BAD_REQUEST, "Insufficient points to claim this reward");
    }

    // Deduct points and decrease stock immediately (hold them)
    wallet.pointsBalance -= reward.points;
    wallet.pointsUsed += reward.points;
    await wallet.save({ session });

    reward.stock -= 1;
    await reward.save({ session });

    const orgId = user.organizationId || user._id;

    const claim = await RewardClaim.create(
      [
        {
          user: user._id,
          organizationId: orgId,
          department: user.department,
          reward: reward._id,
          points: reward.points,
          status: ClaimStatus.PENDING,
        },
      ],
      { session }
    );

    await PointsTransaction.create(
      [
        {
          senderEmail: user.email,
          receiverEmail: "SYSTEM",
          points: reward.points,
          type: "REDEEM",
          status: "PENDING",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return claim[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getClaims = async (query: Record<string, string>, decodedToken: JwtPayload) => {
  const filter: any = {};

  if (decodedToken.role === Role.USER) {
    filter.user = decodedToken.userId;
  } else if (decodedToken.role === Role.ORGANIZATION_ADMIN) {
    filter.organizationId = decodedToken.userId;
  } else if (decodedToken.role === Role.DEPARTMENT_ADMIN) {
    filter.organizationId = decodedToken.organizationId;
    filter.department = decodedToken.department;
  }

  const queryBuilder = new QueryBuilder(
    RewardClaim.find(filter).populate("user", "name email picture").populate("reward", "name category image"),
    query
  )
    .filter()
    .sort()
    .paginate();

  const data = await queryBuilder.build();
  const meta = await queryBuilder.getMeta();

  return { data, meta };
};

const getClaimStats = async (decodedToken: JwtPayload) => {
  const filter: any = {};

  if (decodedToken.role === Role.ORGANIZATION_ADMIN) {
    filter.organizationId = new mongoose.Types.ObjectId(decodedToken.userId);
  } else if (decodedToken.role === Role.DEPARTMENT_ADMIN) {
    filter.organizationId = new mongoose.Types.ObjectId(decodedToken.organizationId);
    filter.department = decodedToken.department;
  }

  const stats = await RewardClaim.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        pending: { $sum: { $cond: [{ $eq: ["$status", ClaimStatus.PENDING] }, 1, 0] } },
        approved: { $sum: { $cond: [{ $eq: ["$status", ClaimStatus.APPROVED] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ["$status", ClaimStatus.REJECTED] }, 1, 0] } },
        totalPointsRedeemed: { $sum: { $cond: [{ $eq: ["$status", ClaimStatus.APPROVED] }, "$points", 0] } },
      },
    },
  ]);

  return stats[0] || { pending: 0, approved: 0, rejected: 0, totalPointsRedeemed: 0 };
};

const updateClaimStatus = async (claimId: string, status: ClaimStatus, decodedToken: JwtPayload) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const claim = await RewardClaim.findById(claimId).populate("user").session(session);
    if (!claim) throw new AppError(httpStatus.NOT_FOUND, "Claim not found");

    if (claim.status !== ClaimStatus.PENDING) {
      throw new AppError(httpStatus.BAD_REQUEST, `Claim is already ${claim.status}`);
    }

    // SaaS Isolation Check
    if (decodedToken.role !== Role.SUPER_ADMIN) {
      const orgId = decodedToken.role === Role.ORGANIZATION_ADMIN ? decodedToken.userId : decodedToken.organizationId;
      if (claim.organizationId?.toString() !== orgId) {
        throw new AppError(httpStatus.FORBIDDEN, "Not authorized to manage this claim");
      }
    }

    if (status === ClaimStatus.APPROVED) {
      claim.status = ClaimStatus.APPROVED;
      await claim.save({ session });
      
      // Update transaction status
      await PointsTransaction.findOneAndUpdate(
        { senderEmail: (claim.user as any).email, points: claim.points, type: "REDEEM", status: "PENDING" },
        { status: "COMPLETED" },
        { session }
      );
    } else if (status === ClaimStatus.REJECTED) {
      // Refund points and restore stock
      const { year, quarter } = getCurrentQuarter();
      const wallet = await Wallet.findOne({ user: claim.user._id, year, quarter }).session(session);
      const reward = await Reward.findById(claim.reward).session(session);

      if (wallet) {
        wallet.pointsBalance += claim.points;
        wallet.pointsUsed -= claim.points;
        await wallet.save({ session });
      }

      if (reward) {
        reward.stock += 1;
        await reward.save({ session });
      }

      claim.status = ClaimStatus.REJECTED;
      await claim.save({ session });

      await PointsTransaction.findOneAndUpdate(
        { senderEmail: (claim.user as any).email, points: claim.points, type: "REDEEM", status: "PENDING" },
        { status: "FAILED" },
        { session }
      );
    }

    await session.commitTransaction();
    return claim;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const RedeemServices = {
  createClaim,
  getClaims,
  getClaimStats,
  updateClaimStatus,
};