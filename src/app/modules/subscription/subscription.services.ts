import { stripe } from "../../config/stripe";
import { Plan } from "../plan/plan.model";
import { User } from "../user/user.model";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status-codes";
import { Subscription } from "./subscription.model";

const createCheckoutSession = async (userId: string, planId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const plan = await Plan.findById(planId);
  if (!plan || !plan.stripePriceId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid plan or missing Stripe Price ID");
  }

  let stripeCustomerId = user.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user._id.toString() },
    });

    stripeCustomerId = customer.id;
    user.stripeCustomerId = stripeCustomerId;
    await user.save();
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    subscription_data: {
      metadata: {
        userId: user._id.toString(),
        planId: plan._id.toString(),
      },
    },
    metadata: {
      userId: user._id.toString(),
      planId: plan._id.toString(),
    },
  });

  return session.url;
};

const getMySubscription = async (userId: string) => {
  return await Subscription.findOne({ user: userId }).populate("plan");
};

const getAllSubscriptions = async () => {
  return await Subscription.find()
    .populate("user", "name email")
    .populate("plan")
    .sort({ createdAt: -1 });
};

const getSingleSubscription = async (id: string) => {
  const subscription = await Subscription.findById(id).populate("user").populate("plan");

  if (!subscription) {
    throw new AppError(httpStatus.NOT_FOUND, "Subscription not found");
  }
  return subscription;
};

export const SubscriptionService = {
  getMySubscription,
  getAllSubscriptions,
  getSingleSubscription,
  createCheckoutSession,
};