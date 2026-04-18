import dayjs from "dayjs"
import quarterOfYear from "dayjs/plugin/quarterOfYear"
import { Recognition } from "../recognition/recognition.model"
import { User } from "../user/user.model"
import { IsActive } from "../user/user.interface"

dayjs.extend(quarterOfYear)

const getDashboard = async () => {

  const startOfQuarter = dayjs().startOf("quarter").toDate()
  const endOfQuarter = dayjs().endOf("quarter").toDate()

  // total recognition
  const totalRecognitions = await Recognition.countDocuments({
    createdAt: { $gte: startOfQuarter, $lte: endOfQuarter }
  })

  // points distributed
  const pointsData = await Recognition.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfQuarter, $lte: endOfQuarter }
      }
    },
    {
      $group: {
        _id: null,
        totalPoints: { $sum: "$points" }
      }
    }
  ])

  const pointsDistributed = pointsData[0]?.totalPoints || 0

  // active users
  const activeUsers = await User.countDocuments({
    isActive: IsActive.ACTIVE
  })

  // weekly recognition graph
  const weeklyGraph = await Recognition.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfQuarter, $lte: endOfQuarter }
      }
    },
    {
      $group: {
        _id: { $week: "$createdAt" },
        total: { $sum: 1 }
      }
    },
    {
      $sort: { "_id": 1 }
    }
  ])

  // top recognized users
  const topRecognized = await Recognition.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfQuarter, $lte: endOfQuarter }
      }
    },
    {
      $group: {
        _id: "$receiverEmail",
        totalPoints: { $sum: "$points" },
        totalRecognitions: { $sum: 1 }
      }
    },
    {
      $sort: { totalPoints: -1 }
    },
    {
      $limit: 5
    }
  ])

  return {
    totalRecognitions,
    pointsDistributed,
    activeUsers,
    weeklyGraph,
    topRecognized
  }
}

const getReports = async (filters: any) => {

  const { startDate, endDate, department } = filters
console.log("Received filters in getReports:", filters)
  const matchStage: any = {}

  if (department) {
    matchStage.department = department
  }
  console.log("Match stage after department filter:", matchStage)
  console.log("department filter:", department)

  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }

  // 🔥 Department chart
 const departmentData = await Recognition.aggregate([
  { $match: matchStage },

  // 👇 user collection join করো
  {
    $lookup: {
      from: "users",
      localField: "user",
      foreignField: "_id",
      as: "user"
    }
  },

  { $unwind: "$user" },

  {
    $group: {
      _id: "$user.department",
      total: { $sum: 1 }
    }
  },

  {
    $project: {
      _id: 0,
      department: "$_id",
      total: 1
    }
  }
])
  console.log("Department data:", departmentData)

  // 🔥 Value pie chart
  const totalCount = await Recognition.countDocuments(matchStage)

  const valueData = await Recognition.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$value",
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        value: "$_id",
        percent: {
          $multiply: [
            { $divide: ["$count", totalCount || 1] },
            100
          ]
        }
      }
    }
  ])

  // 🔥 Line chart
  const trendData = await Recognition.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalPoints: { $sum: "$points" }
      }
    },
    {
      $project: {
        _id: 0,
        month: "$_id",
        totalPoints: 1
      }
    },
    { $sort: { month: 1 } }
  ])

  return {
    departmentData,
    valueData,
    trendData
  }
}

export const DashboardServices = {
  getDashboard,
  getReports
}