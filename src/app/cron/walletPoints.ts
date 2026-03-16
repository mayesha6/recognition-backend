import cron from "node-cron"
import { User } from "../modules/user/user.model"
import { Wallet } from "../modules/wallet/wallet.model"

export const walletPoints = async () => {
  cron.schedule("0 0 1 */3 *", async () => {  // 5 মিনিট interval
    console.log("Running wallet reset/create cycle...")

    const users = await User.find()
    const now = new Date()
    const month = now.getMonth() + 1
    const quarter = Math.ceil(month / 3)
    const year = now.getFullYear()

    for (const user of users) {
      const wallet = await Wallet.findOne({ user: user._id, year, quarter })

      if (wallet) {
        // Wallet already exists → reset balance
        wallet.pointsAllocated = 0
        wallet.pointsUsed = 0
        wallet.pointsBalance = 0
        await wallet.save()
        console.log(`Wallet for user ${user._id} exists. Balance reset 0`)
      } else {
        // Wallet doesn't exist → create new
        await Wallet.create({
          user: user._id,
          year,
          quarter,
          pointsAllocated: 0,
          pointsUsed: 0,
          pointsBalance: 0
        })
        console.log(`Wallet for user ${user._id} created with balance 0`)
      }
    }

    console.log("Wallet reset/create cycle completed")
  })
}