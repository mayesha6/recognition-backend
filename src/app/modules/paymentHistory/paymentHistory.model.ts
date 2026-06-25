import { Schema, model, Types } from "mongoose";

export interface IPaymentHistory {
  organizationId: Types.ObjectId;
  planId: Types.ObjectId;
  stripeSubscriptionId: string;
  amount: number; // কত টাকা পেমেন্ট করেছে
  currency: string;
  status: "PAID" | "FAILED";
  createdAt?: Date;
  updatedAt?: Date;
}

const paymentHistorySchema = new Schema<IPaymentHistory>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    stripeSubscriptionId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    status: { type: String, enum: ["PAID", "FAILED"], default: "PAID" },
  },
  { timestamps: true }
);

export const PaymentHistory = model<IPaymentHistory>("PaymentHistory", paymentHistorySchema);