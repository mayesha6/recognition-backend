// import { Request, Response, NextFunction } from "express";
// import { catchAsync } from "../../utils/catchAsync";
// import { sendResponse } from "../../utils/sendResponse";
// import { JwtPayload } from "jsonwebtoken";
// import { SubscriptionService } from "./subscription.services";

// /**
//  * 💳 CREATE CHECKOUT SESSION
//  */
// const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
//   const user = req.user as JwtPayload;

//   const url = await SubscriptionService.createCheckoutSession(
//     user.userId,
//     req.body.planId
//   );

//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     message: "Checkout session created",
//     data: url,
//   });
// });

// /**
//  * ❌ CANCEL SUBSCRIPTION
//  */
// const cancelSubscription = catchAsync(async (req: Request, res: Response) => {
//   const user = req.user as JwtPayload;

//   const result = await SubscriptionService.cancelSubscription(user.userId);

//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     message: "Subscription cancelled",
//     data: result,
//   });
// });

// /**
//  * 💳 BILLING PORTAL
//  */
// const billingPortal = catchAsync(async (req: Request, res: Response) => {
//   const user = req.user as JwtPayload;

//   const url = await SubscriptionService.openBillingPortal(user.userId);

//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     message: "Billing portal created",
//     data: url,
//   });
// });

// export const SubscriptionController = {
//   createCheckoutSession,
//   cancelSubscription,
//   billingPortal,
// };

import { Request, Response } from "express";
import { SubscriptionService } from "./subscription.services";
import { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const createCheckoutSession = async (
  req: Request,
  res: Response
) => {
  const user = req.user as JwtPayload; // from auth middleware
  const userId = user.userId;
  const { planId } = req.body;

  const url = await SubscriptionService.createCheckoutSession(userId, planId);

  res.status(200).json({
    success: true,
    checkoutUrl: url,
  });
};

// ===============================
// 👤 USER: My Subscription
// ===============================
const getMySubscription = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  const result = await SubscriptionService.getMySubscription(user.userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "My subscription fetched successfully",
    data: result,
  });
});

// ===============================
// 🧑‍💼 ADMIN: All Subscriptions
// ===============================
const getAllSubscriptions = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.getAllSubscriptions();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All subscriptions fetched successfully",
    data: result,
  });
});

// ===============================
// 🔍 ADMIN: Single Subscription
// ===============================
const getSingleSubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.getSingleSubscription(req.params.id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Subscription fetched successfully",
    data: result,
  });
});

export const SubscriptionController = {
  getMySubscription,
  getAllSubscriptions,
  getSingleSubscription,
  createCheckoutSession
};