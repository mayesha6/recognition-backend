import { Schema, model, Types, CallbackWithoutResultAndOptionalError } from "mongoose";
import { ISupportTicket, TicketPriority, TicketStatus } from "./support.interface";

const ticketResponseSchema = new Schema(
  {
    message: { type: String, required: true },
    sender: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketId: { type: String, required: true, unique: true },
    user: { type: Types.ObjectId, ref: "User", required: true },
    organizationId: { type: Types.ObjectId, ref: "User", default: null },
    category: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: Object.values(TicketPriority),
      default: TicketPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.OPEN,
    },
    responses: [ticketResponseSchema],
  },
  { timestamps: true }
);

// Auto-generate a unique Ticket ID before saving
supportTicketSchema.pre("validate", function (next: CallbackWithoutResultAndOptionalError) {
  if (!this.ticketId) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    this.ticketId = `TCK-${randomNum}`;
  }
  next();
});

export const SupportTicket = model<ISupportTicket>("SupportTicket", supportTicketSchema);