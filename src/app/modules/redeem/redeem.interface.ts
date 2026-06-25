import { Types } from "mongoose";

export enum ClaimStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
}

export interface IRewardClaim {
  claimId: string;
  user: Types.ObjectId;
  organizationId: Types.ObjectId | null;
  department: string;
  reward: Types.ObjectId;
  points: number;
  status: ClaimStatus;
  createdAt?: Date;
  updatedAt?: Date;
}