import { Schema, model, Types } from "mongoose";
import { IDepartment } from "./department.interface";

const departmentSchema = new Schema<IDepartment>(
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

// Allow duplicate department names across different organizations, but keep them unique within the same organization
departmentSchema.index({ name: 1, organizationId: 1 }, { unique: true });

export const Department = model<IDepartment>("Department", departmentSchema);