import cron from "node-cron"
import { User } from "../modules/user/user.model"
import { Wallet } from "../modules/wallet/wallet.model"

export const walletPoints = async () => {
cron.schedule("0 0 1 */3 *", async () => {

  console.log("Running quarterly wallet creation")

  const users = await User.find()

  const now = new Date()
  const month = now.getMonth() + 1
  const quarter = Math.ceil(month / 3)
  const year = now.getFullYear()

  for (const user of users) {

    await Wallet.create({
      user: user._id,
      year,
      quarter,
      pointsAllocated: 100,
      pointsUsed: 0,
      pointsBalance: 100
    })

  }

  console.log("Wallets created for new quarter")

})
}