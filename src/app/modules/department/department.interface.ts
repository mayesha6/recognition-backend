import { Types } from "mongoose";

export interface IDepartment {
  name: string;
  organizationId?: Types.ObjectId | null;
  createdBy: Types.ObjectId;
}