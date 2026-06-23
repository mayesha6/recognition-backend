import { Schema, model, Types } from "mongoose";
import { SubscriptionStatus } from "../user/user.interface";

const subscriptionSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    plan: { type: Types.ObjectId, ref: "Plan", required: true },

    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },

    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.TRIAL,
    },

    currentPeriodEnd: { type: Date }, // billing tracking
    trialEnd: { type: Date }, 
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Subscription = model("Subscription", subscriptionSchema);