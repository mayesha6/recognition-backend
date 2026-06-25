import { Schema, model, Types } from "mongoose";
import { IDepartmentAdmin } from "./departmentAdmin.interface";

const deptAdminSchema = new Schema<IDepartmentAdmin>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    department: { type: String, required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedBudget: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const DeptAdmin = model<IDepartmentAdmin>("DeptAdmin", deptAdminSchema);