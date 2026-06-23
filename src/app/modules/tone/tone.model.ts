import { Schema, model, Types } from "mongoose";
import { ITone } from "./tone.interface";

const toneSchema = new Schema<ITone>(
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

// Allow duplicate tone names across different organizations, but keep them unique within the same organization
toneSchema.index({ name: 1, organizationId: 1 }, { unique: true });

export const Tone = model<ITone>("Tone", toneSchema);