import { Types } from "mongoose";

export interface IRecognitionValue {
  name: string;
  description?: string;
  organizationId?: Types.ObjectId | null;
  createdBy: Types.ObjectId;
}