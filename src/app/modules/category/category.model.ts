import { Schema, model, Types } from "mongoose";
import { ICategory } from "./category.interface";

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    organizationId: {
      type: Types.ObjectId,
      ref: "User",
      default: null, // null means global/individual system category
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Allow same category names across different organizations
categorySchema.index({ name: 1, organizationId: 1 }, { unique: true });

export const Category = model<ICategory>("Category", categorySchema);