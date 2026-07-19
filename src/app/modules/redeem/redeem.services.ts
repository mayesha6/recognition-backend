import mongoose from "mongoose";
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { RewardClaim } from "./redeem.model";
import { Reward } from "../reward/reward.model";
import { User } from "../user/user.model";
import { Notification } from "../notification/notification.model";
import { Wallet } from "../wallet/wallet.model";
import { PointsTransaction } from "../points/points.model";
import { getCurrentQuarter } from "../../utils/wallet";
import { QueryBuilder } from "../../utils/QueryBuiler";
import { JwtPayload } from "jsonwebtoken";
import { ClaimStatus } from "./redeem.interface";
import { Role } from "../user/user.interface";
import dayjs from "dayjs";

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

    // Create notification for Org Admin(s)
    try {
      const orgAdmin = await User.findOne({ _id: user.organizationId, role: Role.ORGANIZATION_ADMIN }) || 
                       await User.findOne({ organizationId: user.organizationId, role: Role.ORGANIZATION_ADMIN });
      if (orgAdmin) {
        await Notification.create({
          recipient: orgAdmin._id,
          sender: user._id,
          title: "New Reward Claim Request",
          message: `${user.name} submitted a claim for ${reward.name}`,
          type: "CLAIM",
          link: "/org-admin/reward-claim",
        });
      }
    } catch (err) {
      console.error("Failed to create claim notification:", err);
    }

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
  const startOfMonth = dayjs().startOf("month").toDate();
  const endOfMonth = dayjs().endOf("month").toDate();

  let orgFilter: any = {};
  let rewardFilter: any = {};

  // ==========================================
  // 🔐 ROLE BASED FILTERING
  // ==========================================
  if (decodedToken.role === Role.ORGANIZATION_ADMIN) {
    orgFilter.organizationId = new mongoose.Types.ObjectId(decodedToken.userId);
    rewardFilter.$or = [{ organizationId: null }, { organizationId: decodedToken.userId }];
  } else if (decodedToken.role === Role.DEPARTMENT_ADMIN) {
    orgFilter.organizationId = new mongoose.Types.ObjectId(decodedToken.organizationId);
    orgFilter.department = decodedToken.department;
    rewardFilter.$or = [{ organizationId: null }, { organizationId: decodedToken.organizationId }];
  } else if (decodedToken.role === Role.SUPER_ADMIN) {
    rewardFilter.organizationId = null; // Global rewards
  }

  // অর্গানাইজেশনের ইউজারদের আইডি বের করা (Points in circulation এর জন্য)
  const usersInOrg = await User.find(orgFilter).select("_id");
  const userIds = usersInOrg.map((u) => u._id);

  // ==========================================
  // 🚀 FETCH ALL 4 STATS CONCURRENTLY
  // ==========================================
  const [
    totalRewards,
    pointsInCirculationData,
    redemptionsThisMonth,
    topRewardData
  ] = await Promise.all([
    
    // ১. Total Rewards (অ্যাক্টিভ রিওয়ার্ডের সংখ্যা)
    Reward.countDocuments({ ...rewardFilter, status: "Active" }),

    // ২. Points in Circulation (ইউজারদের ওয়ালেটে থাকা অব্যবহৃত পয়েন্ট)
    Wallet.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: null, totalPoints: { $sum: "$pointsBalance" } } }
    ]),

    // ৩. Redemptions This Month (এই মাসে কয়টি ক্লেইম অ্যাপ্রুভ হয়েছে)
    RewardClaim.countDocuments({
      ...orgFilter,
      status: ClaimStatus.APPROVED,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    }),

    // ৪. Top Reward (সবচেয়ে বেশি ক্লেইম হওয়া রিওয়ার্ড)
    RewardClaim.aggregate([
      { $match: { ...orgFilter, status: ClaimStatus.APPROVED } },
      { $group: { _id: "$reward", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      { $lookup: { from: "rewards", localField: "_id", foreignField: "_id", as: "rewardDetails" } },
      { $unwind: "$rewardDetails" },
      { $project: { _id: 0, name: "$rewardDetails.name", count: 1 } }
    ])
  ]);

  return {
    totalRewards,
    pointsInCirculation: pointsInCirculationData[0]?.totalPoints || 0,
    redemptionsThisMonth,
    topReward: topRewardData[0]?.name || "N/A"
  };
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

    // Create notification for the user who claimed the reward
    try {
      const rewardDoc = await Reward.findById(claim.reward);
      const rewardName = rewardDoc ? rewardDoc.name : "reward";
      await Notification.create({
        recipient: claim.user._id,
        sender: decodedToken.userId,
        title: `Claim Reward ${status}`,
        message: `Your claim for "${rewardName}" has been ${status.toLowerCase()}`,
        type: "CLAIM",
        link: "/user/claim-rewards",
      });
    } catch (err) {
      console.error("Failed to create claim decision notification:", err);
    }

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