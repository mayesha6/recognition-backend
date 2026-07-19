import { Schema, model } from "mongoose";
import { INotification, NotificationType } from "./notification.interface";

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", default: null },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    isRead: { type: Boolean, default: false },
    link: { type: String, default: null },
  },
  { timestamps: true }
);

// Compound Index for fast lookup of unread notifications by recipient
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = model<INotification>("Notification", notificationSchema);
