import { Wallet } from "./wallet.model"

const getWallet = async (userId: string, year: number, quarter: number) => {

  const wallet = await Wallet.findOne({
    user: userId,
    year,
    quarter
  })

  return wallet
}

export const WalletServices = {
    getWallet
};