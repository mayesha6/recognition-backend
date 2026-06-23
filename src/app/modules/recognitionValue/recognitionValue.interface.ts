import { Types } from "mongoose";

export interface IRecognitionValue {
  name: string;
  organizationId?: Types.ObjectId | null;
  createdBy: Types.ObjectId;
}