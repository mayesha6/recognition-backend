import { Schema, model, Types } from "mongoose";
import { ActivityType, IActivityLog } from "./dashboard.interface";

const activityLogSchema = new Schema<IActivityLog>(
  {
    organizationId: {
      type: Types.ObjectId,
      ref: "User",
      default: null,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(ActivityType),
      required: true,
    },
  },
  { timestamps: true }
);

export const ActivityLog = model<IActivityLog>("ActivityLog", activityLogSchema);