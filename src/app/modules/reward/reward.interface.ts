import { Types } from "mongoose";

export enum RewardStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
}

export interface IReward {
  name: string;
  category?: string;
  points: number;
  stock: number;
  status: RewardStatus;
  description?: string;
  image?: string;
  
  // 🔥 SaaS Tracking
  organizationId?: Types.ObjectId | null;
  createdBy: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}