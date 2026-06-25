import { Schema, model, Types } from "mongoose";
import { IRewardClaim, ClaimStatus } from "./redeem.interface";

const rewardClaimSchema = new Schema<IRewardClaim>(
  {
    claimId: { type: String, required: true, unique: true },
    user: { type: Types.ObjectId, ref: "User", required: true },
    organizationId: { type: Types.ObjectId, ref: "User", default: null },
    department: { type: String, required: true },
    reward: { type: Types.ObjectId, ref: "Reward", required: true },
    points: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(ClaimStatus),
      default: ClaimStatus.PENDING,
    },
  },
  { timestamps: true }
);

// Auto-generate a unique Claim ID before saving
rewardClaimSchema.pre("validate", function (next) {
  if (!this.claimId) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.claimId = `CLM-${randomNum}`;
  }
  next();
});

export const RewardClaim = model<IRewardClaim>("RewardClaim", rewardClaimSchema);