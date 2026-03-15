import { Schema, model } from "mongoose";
import { IPointsTransaction } from "./points.interface";

const pointsTransactionSchema = new Schema<IPointsTransaction>({
  senderEmail: { type: String, required: true },
  receiverEmail: { type: String, required: true },
  points: { type: Number, required: true },
  description: { type: String },
  type: {
    type: String,
    enum: ["RECOGNITION", "REDEEM", "ADJUSTMENT"],
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "COMPLETED", "FAILED"],
    default: "COMPLETED"
  }


}, {
  timestamps: true,
  versionKey: false
});

export const PointsTransaction = model<IPointsTransaction>(
  "PointsTransaction",
  pointsTransactionSchema
);