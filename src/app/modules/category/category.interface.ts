import { Types } from "mongoose";

export interface ICategory {
  name: string;
  description?: string;
  images: string[];
  organizationId?: Types.ObjectId | null;
  createdBy: Types.ObjectId;
}