import { Schema, model, Types } from "mongoose";
import { IRecognitionValue } from "./recognitionValue.interface";

const recognitionValueSchema = new Schema<IRecognitionValue>(
  {
    name: {
      type: String,
      required: true,
    },
    organizationId: {
      type: Types.ObjectId,
      ref: "User",
      default: null, // null means it belongs to individual/global system
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Allow duplicate recognition value names across different organizations, but keep them unique within the same organization
recognitionValueSchema.index({ name: 1, organizationId: 1 }, { unique: true });

export const RecognitionValue = model<IRecognitionValue>("RecognitionValue", recognitionValueSchema);