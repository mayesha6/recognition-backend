import { Schema, model } from "mongoose"
import { IDepartment } from "./department.interface"

const departmentSchema = new Schema<IDepartment>({
  name: {
    type: String,
    // enum: Object.values(CategoryName),
    required: true,
    unique: true
  },


}, { timestamps: true })

export const Department = model<IDepartment>(
  "Department",
  departmentSchema
)