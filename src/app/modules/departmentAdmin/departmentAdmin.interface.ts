import { Types } from "mongoose";

export interface IDepartmentAdmin {
  user: Types.ObjectId;
  department: string;
  organizationId: Types.ObjectId;
  assignedBudget: number;
}