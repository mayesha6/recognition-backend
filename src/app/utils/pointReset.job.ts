// import cron from "node-cron"
// import { User } from "../modules/user/user.model"
// import { DesignationPoints } from "../modules/designation/designation.model"

// cron.schedule("0 0 1 */3 *", async () => {

//   console.log("Running quarterly points reset...")

//   const users = await User.find()

//   for (const user of users) {

//     const designationData = await DesignationPoints.findOne({
//       designation: user.designation
//     })

//     if (designationData) {
//       user.pointsBalance = designationData.quarterlyPoints
//       await user.save()
//     }
//   }

//   console.log("Quarterly points reset completed")

// })