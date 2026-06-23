import { PointsTransaction } from "./points.model";
import { User } from "../user/user.model";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status-codes";

import { Wallet } from "../wallet/wallet.model";
import { getCurrentQuarter } from "../../utils/wallet";

const getUserTransactions = async (email: string) => {
  return await PointsTransaction.find({
    $or: [{ senderEmail: email }, { receiverEmail: email }]
  }).sort({ createdAt: -1 });
}

const getUserBalance = async (email: string) => {

  const user = await User.findOne({ email })
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found")

  const { year, quarter } = getCurrentQuarter()

  const wallet = await Wallet.findOne({
    user: user._id,
    year,
    quarter
  })

  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Wallet not found")
  }

  return wallet.pointsBalance
}

export const PointsService = {
  getUserTransactions,
  getUserBalance
};