import { Schema, model, Types } from "mongoose";
import { IReward, RewardStatus } from "./reward.interface";

const rewardSchema = new Schema<IReward>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    points: { type: Number, required: true, min: 1 },
    stock: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(RewardStatus),
      default: RewardStatus.ACTIVE,
    },
    description: { type: String },
    image: { type: String },
    
    // 🔥 Multi-tenant fields
    organizationId: {
      type: Types.ObjectId,
      ref: "User",
      default: null, // null means global reward by Super Admin
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Allow same reward names across different organizations
rewardSchema.index({ name: 1, organizationId: 1 }, { unique: true });

export const Reward = model<IReward>("Reward", rewardSchema);