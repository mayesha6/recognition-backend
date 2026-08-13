import { Types } from "mongoose";

export interface ITone {
  name: string;
  description?: string;
  organizationId?: Types.ObjectId | null;
  createdBy: Types.ObjectId;
}