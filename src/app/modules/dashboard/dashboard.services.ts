import dayjs from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import { Recognition } from "../recognition/recognition.model";
import { User } from "../user/user.model";
import { Subscription } from "../subscription/subscription.model";
import { PaymentHistory } from "../paymentHistory/paymentHistory.model"; // 🔥 Updated Import
import { Department } from "../department/department.model";
import { AccountType, IsActive, Role } from "../user/user.interface";
import { SubscriptionStatus } from "../subscription/subscription.interface";
import { ActivityLog } from "./dashboard.model";
import { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { Wallet } from "../wallet/wallet.model";

dayjs.extend(quarterOfYear);

const getDashboard = async () => {
  const startOfMonth = dayjs().startOf("month").toDate();
  const endOfMonth = dayjs().endOf("month").toDate();
  const startOfYear = dayjs().startOf("year").toDate();
  const endOfYear = dayjs().endOf("year").toDate();

  const [
    totalOrganizations,
    totalDepartments,
    activeUsers,
    activeSubscriptions,
    monthlyRevenueData,
    totalRecognitions,
    platformPerformance,
    revenueGrowth,
    planDistribution,
    recentActivities,
  ] = await Promise.all([
    User.countDocuments({ accountType: AccountType.ORGANIZATION }),
    Department.countDocuments({ organizationId: null }),
    User.countDocuments({ isActive: IsActive.ACTIVE, accountType: AccountType.INDIVIDUAL }),
    Subscription.countDocuments({ status: SubscriptionStatus.ACTIVE }),
    
    // 🔥 Monthly Revenue (Current Month)
    PaymentHistory.aggregate([
      { $match: { status: "PAID", createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]),

    Recognition.countDocuments({ createdAt: { $gte: startOfYear, $lte: endOfYear } }),

    Recognition.aggregate([
      { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } } },
      { $group: { _id: { $month: "$createdAt" }, total: { $sum: 1 } } },
      { $sort: { "_id": 1 } }
    ]),

    // 🔥 Revenue Growth Line Chart (Current Year)
    PaymentHistory.aggregate([
      { $match: { status: "PAID", createdAt: { $gte: startOfYear, $lte: endOfYear } } },
      { $group: { _id: { $month: "$createdAt" }, total: { $sum: "$amount" } } },
      { $sort: { "_id": 1 } }
    ]),

    Subscription.aggregate([
      { $match: { status: SubscriptionStatus.ACTIVE } },
      { $lookup: { from: "plans", localField: "plan", foreignField: "_id", as: "planData" } },
      { $unwind: "$planData" },
      { $group: { _id: "$planData.name", count: { $sum: 1 } } }
    ]),

    ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("organizationId", "name picture")
  ]);

  const monthlyRevenue = monthlyRevenueData[0]?.total || 0;

  return {
    overview: {
      totalOrganizations,
      totalDepartments,
      activeUsers,
      activeSubscriptions,
      monthlyRevenue,
      totalRecognitions,
    },
    charts: {
      platformPerformance,
      revenueGrowth,
      planDistribution,
    },
    recentActivities,
  };
};

const getReports = async (filters: any) => {
  const { startDate, endDate, department } = filters;
  const matchStage: any = {};

  if (department) {
    matchStage.department = department;
  }

  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // Department Chart
  const departmentData = await Recognition.aggregate([
    { $match: matchStage },
    { $lookup: { from: "users", localField: "receiverEmail", foreignField: "email", as: "receiver" } },
    { $unwind: "$receiver" },
    { $group: { _id: "$receiver.department", total: { $sum: 1 } } },
    { $project: { _id: 0, department: "$_id", total: 1 } }
  ]);

  // Value Pie Chart
  const valueData = await Recognition.aggregate([
    { $match: matchStage },
    { $match: { recognition_values: { $exists: true, $ne: [] } } },
    { $unwind: "$recognition_values" },
    { $group: { _id: "$recognition_values", count: { $sum: 1 } } }
  ]);

  // Line Chart Trend
  const trendData = await Recognition.aggregate([
    { $match: matchStage },
    { $group: { _id: { $month: "$createdAt" }, totalPoints: { $sum: "$points" } } },
    { $project: { _id: 0, month: "$_id", totalPoints: 1 } },
    { $sort: { month: 1 } }
  ]);

  return {
    departmentData,
    valueData,
    trendData,
  };
};

const getOrgDashboard = async (userId: string) => {
  const orgId = new mongoose.Types.ObjectId(userId);

  const [
    totalEmployees,
    activeEmployees,
    recognitionsSent,
    pointsInCirculation,
    topPerformers,
    departmentPerformance,
    totalDepartmentsArray
  ] = await Promise.all([
    User.countDocuments({ organizationId: orgId, role: { $in: [Role.USER, Role.DEPARTMENT_ADMIN] } }),
    User.countDocuments({ organizationId: orgId, role: { $in: [Role.USER, Role.DEPARTMENT_ADMIN] }, isActive: IsActive.ACTIVE }),
    Recognition.countDocuments({ organizationId: orgId }),
    
    // Wallet এ organizationId থাকলে এটি কাজ করবে
    Wallet.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: null, total: { $sum: "$pointsBalance" } } }
    ]),

    // Top Performers
    Recognition.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: "$receiverEmail", totalPoints: { $sum: "$points" } } },
      { $sort: { totalPoints: -1 } },
      { $limit: 5 },
      // receiverEmail দিয়ে ইউজার জয়েন করা নিরাপদ, যদি receiverId সব সময় না থাকে
      { 
        $lookup: { 
          from: "users", 
          localField: "_id", // এখানে _id মানে receiverEmail
          foreignField: "email", 
          as: "user" 
        } 
      },
      { $unwind: "$user" }
    ]),

    Recognition.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $project: { _id: 0, department: "$_id", count: 1 } }
    ]),

    User.distinct("department", { organizationId: orgId, role: { $in: [Role.USER, Role.DEPARTMENT_ADMIN] } })
  ]);

  return {
    overview: {
      totalEmployees,
      activeEmployees,
      totalDepartments: totalDepartmentsArray.length,
      recognitionsSent,
      pointsInCirculation: pointsInCirculation[0]?.total || 0,
    },
    topPerformers: topPerformers.map(p => ({
      name: p.user.name,
      points: p.totalPoints
    })),
    departmentPerformance,
  };
};
export const DashboardServices = {
  getDashboard,
  getReports,
  getOrgDashboard
};