import { getCurrentQuarter } from "../../utils/wallet"
import { User } from "../user/user.model"
import { Wallet } from "./wallet.model"

const getWallet = async (userId: string, year: number, quarter: number) => {

  const wallet = await Wallet.findOne({
    user: userId,
    year,
    quarter
  })

  return wallet
}

const distributePoints = async (
  department: string,
  points: number
) => {

  const users = await User.find({ department })

  const { year, quarter } = getCurrentQuarter()

  for (const user of users) {

    let wallet = await Wallet.findOne({
      user: user._id,
      year,
      quarter
    })

    if (!wallet) {

      wallet = await Wallet.create({
        user: user._id,
        year,
        quarter,
        pointsAllocated: points,
        pointsBalance: points
      })

    } else {

      wallet.pointsAllocated += points
      wallet.pointsBalance += points

      await wallet.save()
    }

  }

  return true
}

export const WalletServices = {
  getWallet,
  distributePoints
};