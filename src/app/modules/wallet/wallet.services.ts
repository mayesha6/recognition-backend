import { JwtPayload } from "jsonwebtoken"
import { getCurrentQuarter } from "../../utils/wallet"
import { User } from "../user/user.model"
import { Wallet } from "./wallet.model"
import AppError from "../../errorHelpers/AppError"
import httpStatus from "http-status-codes";
import mongoose from "mongoose"

const getWallet = async (userId: string, year: number, quarter: number) => {

  const wallet = await Wallet.findOne({
    user: userId,
    year,
    quarter
  })

  return wallet
}

const distributePoints = async (department: string, points: number) => {

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const users = await User.find({ department }).select("_id");
if (users.length === 0) {
  throw new AppError( httpStatus.NOT_FOUND, "No users found in this department");
}
    const { year, quarter } = getCurrentQuarter();

    const operations = users.map(user => ({
      updateOne: {
        filter: {
          user: user._id,
          year,
          quarter
        },
        update: {
          $inc: {
            pointsAllocated: points,
            pointsBalance: points
          },
          $setOnInsert: {
            pointsUsed: 0
          }
        },
        upsert: true
      }
    }));

    await Wallet.bulkWrite(operations, { session });

    await session.commitTransaction();
    return true;

  } catch (error) {
    await session.abortTransaction();
    throw error;

  } finally {
    session.endSession();
  }
};

const resetPoints = async (department?: string) => {

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { year, quarter } = getCurrentQuarter();

    let userFilter: any = {};

    if (department) {
      const users = await User.find({ department })
        .select("_id")
        .session(session);

      userFilter = { user: { $in: users.map(u => u._id) } };
    }

    await Wallet.updateMany(
      {
        year,
        quarter,
        ...userFilter
      },
      {
        $set: {
          pointsAllocated: 0,
          pointsBalance: 0,
          pointsUsed: 0
        }
      },
      { session }
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

const setUserPoints = async (
  email: string,
  points: number,
  decodedToken: JwtPayload
) => {

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { year, quarter } = getCurrentQuarter();

    // 🔥 email থেকে user বের করো
    const user = await User.findOne({ email }).session(session);

    if (!user) {
      throw new AppError( httpStatus.NOT_FOUND, "User not found");
    }

    // 🔐 admin department restriction
    if (decodedToken.role === "ADMIN") {
      if (user.department !== decodedToken.department) {
        throw new AppError( httpStatus.FORBIDDEN, "Not allowed");
      }
    }

    // 💰 upsert wallet
    await Wallet.updateOne(
      {
        user: user._id,
        year,
        quarter
      },
      {
        $set: {
          pointsAllocated: points,
          pointsBalance: points,
          pointsUsed: 0
        }
      },
      {
        upsert: true,
        session
      }
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

export const WalletServices = {
  getWallet,
  distributePoints,
  resetPoints,
  setUserPoints
};