import { Schema, model } from "mongoose"
import { IWallet } from "./wallet.interface"

const walletSchema = new Schema<IWallet>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // latest update: required
  year: { type: Number, required: true },
  quarter: { type: Number, required: true },
  pointsAllocated: { type: Number, required: true },
  pointsUsed: { type: Number, default: 0 },
  pointsBalance: { type: Number, required: true }
}, { timestamps: true })

// latest update: compound index updated for multi-tenant queries
walletSchema.index({ organizationId: 1, user: 1, year: 1, quarter: 1 }, { unique: true })

export const Wallet = model<IWallet>("Wallet", walletSchema)