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
  if (!plan) {
    throw new AppError(httpStatus.NOT_FOUND, "Plan not found");
  }

  let stripePriceId = plan.stripePriceId;

  if (stripePriceId) {
    try {
      // Verify if price exists in the active Stripe account
      await stripe.prices.retrieve(stripePriceId);
    } catch (err: any) {
      if (err.statusCode === 404 || err.message?.includes("No such price")) {
        stripePriceId = "";
      } else {
        throw err;
      }
    }
  }

  if (!stripePriceId) {
    try {
      const stripeProduct = await stripe.products.create({
        name: plan.name,
        description: plan.features?.join(", ") || "",
      });

      let stripeInterval: "month" | "year" = "month";
      const intervalStr = String(plan.interval || "").toLowerCase();
      if (intervalStr.includes("year") || intervalStr.includes("annual")) {
        stripeInterval = "year";
      }

      const stripePrice = await stripe.prices.create({
        unit_amount: Math.round(plan.price * 100),
        currency: plan.currency?.toLowerCase() || "usd",
        recurring: {
          interval: stripeInterval,
        },
        product: stripeProduct.id,
      });

      stripePriceId = stripePrice.id;
      plan.stripeProductId = stripeProduct.id;
      plan.stripePriceId = stripePrice.id;
      await plan.save();
    } catch (stripeErr: any) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to register plan on Stripe: ${stripeErr.message}`
      );
    }
  }

  let stripeCustomerId = user.stripeCustomerId;

  if (stripeCustomerId) {
    try {
      // Verify if customer actually exists in Stripe (handles environment or account switching)
      await stripe.customers.retrieve(stripeCustomerId);
    } catch (err: any) {
      if (err.statusCode === 404 || err.message?.includes("No such customer")) {
        stripeCustomerId = null;
      } else {
        throw err;
      }
    }
  }

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
        price: stripePriceId,
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