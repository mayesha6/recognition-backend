import { PointsTransaction } from "./points.model";
import { IPointsTransaction } from "./points.interface";
import { User } from "../user/user.model";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status-codes";

import mongoose from "mongoose"

const createTransaction = async (data: IPointsTransaction) => {
  const session = await mongoose.startSession()

  try {
    session.startTransaction()

    const { senderEmail, receiverEmail, points } = data

    if (points <= 0) {
      throw new AppError(400, "Points must be greater than 0")
    }

    if (senderEmail === receiverEmail) {
      throw new AppError(400, "Sender and receiver cannot be the same")
    }

    const sender = await User.findOne({ email: senderEmail }).session(session)
    if (!sender) throw new AppError(404, "Sender not found")

    if (sender.pointsBalance < points) {
      throw new AppError(400, "Insufficient points")
    }

    const receiver = await User.findOne({ email: receiverEmail }).session(session)
    if (!receiver) throw new AppError(404, "Receiver not found")

    sender.pointsBalance -= points
    receiver.pointsBalance += points

    await sender.save({ session })
    await receiver.save({ session })

    const transaction = await PointsTransaction.create([data], { session })

    await session.commitTransaction()
    session.endSession()

    return transaction[0]

  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    throw error
  }
}

const getUserTransactions = async (email: string) => {
    return await PointsTransaction.find({
        $or: [{ senderEmail: email }, { receiverEmail: email }]
    }).sort({ createdAt: -1 });
}

const getUserBalance = async (email: string) => {
    const user = await User.findOne({ email });
    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");
    return user.pointsBalance;
}

export const PointsService = {
    createTransaction,
    getUserTransactions,
    getUserBalance
};