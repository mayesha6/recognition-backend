import { Types } from "mongoose";

export enum NotificationType {
  RECOGNITION = "RECOGNITION",
  CLAIM = "CLAIM",
  SUPPORT = "SUPPORT",
  SYSTEM = "SYSTEM",
}

export interface INotification {
  recipient: Types.ObjectId;
  sender?: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
