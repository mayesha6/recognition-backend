import { Types } from "mongoose";

export interface ITone {
  name: string;
  organizationId?: Types.ObjectId | null;
  createdBy: Types.ObjectId;
}