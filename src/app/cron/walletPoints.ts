import cron from "node-cron";
import { User } from "../modules/user/user.model";
import { Wallet } from "../modules/wallet/wallet.model";
import { Role } from "../modules/user/user.interface";
import { SubscriptionStatus } from "../modules/subscription/subscription.interface";

export const walletPoints = () => {
  cron.schedule("0 0 1 */3 *", async () => {
    try {
      console.log("Running wallet reset/create cycle...");

      // Populate currentPlan to check for points allocation
      const users = await User.find().populate("currentPlan");

      const now = new Date();
      const month = now.getMonth() + 1;
      const quarter = Math.ceil(month / 3);
      const year = now.getFullYear();

      for (const user of users) {
        // Determine starting points based on active subscription
        let points = 0;
        if (
          user.currentPlan &&
          (user.subscriptionStatus === SubscriptionStatus.ACTIVE || user.subscriptionStatus === SubscriptionStatus.TRIAL)
        ) {
          const plan = user.currentPlan as any;
          points = plan.allocatedPoints || 0;
        }

        const wallet = await Wallet.findOne({
          user: user._id,
          year,
          quarter
        });

        if (wallet) {
          // Wallet already exists -> reset values
          wallet.pointsAllocated = points;
          wallet.pointsUsed = 0;
          wallet.pointsBalance = points;
          await wallet.save();

          console.log(`Wallet for user ${user._id} exists. Balance reset to ${points}`);
        } else {
          // Wallet does not exist -> create new
          await Wallet.create({
            user: user._id,
            year,
            quarter,
            pointsAllocated: points,
            pointsUsed: 0,
            pointsBalance: points,
            organizationId: user.organizationId || user._id,
          });

          console.log(`Wallet for user ${user._id} created with balance ${points}`);
        }
      }

      console.log("Wallet reset/create cycle completed");
    } catch (error) {
      console.error("Error in wallet reset/create cycle:", error);
    }
  });
};