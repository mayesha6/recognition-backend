import { Schema, Types, model } from "mongoose";
import { IPlan } from "./plan.interface";
import { PLAN_INTERVAL } from "./plan.constant";

const planSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    interval: {
      type: String,
      enum: PLAN_INTERVAL,
      required: true,
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stripeProductId: {
      type: String,
      default: null,
    },
    stripePriceId: {
      type: String,
      default: null,
    },
access: {
      products: [
  {
    product: { type: Types.ObjectId, ref: "Product" },
    fileAccess: {
      type: String,
      enum: ["basic", "pro", "vip"],
      required: true,
    },
  },
],
      courses: [{ type: Types.ObjectId, ref: "Course" }],
      bundles: [{ type: Types.ObjectId, ref: "Bundle" }],
    },
  },
  {
    timestamps: true,
  }
);

export const Plan = model<IPlan>("Plan", planSchema);