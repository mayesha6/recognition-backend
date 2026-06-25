import { Types } from "mongoose";

export enum ActivityType {
  UPGRADE = "UPGRADE",
  TRIAL = "TRIAL",
  EXPIRED = "EXPIRED",
  RENEWAL = "RENEWAL",
  TICKET = "TICKET",
  SYSTEM = "SYSTEM"
}

export interface IActivityLog {
  organizationId?: Types.ObjectId;
  description: string;
  type: ActivityType;
  createdAt?: Date;
  updatedAt?: Date;
}