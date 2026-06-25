import { Types } from "mongoose";

export enum TicketStatus {
  OPEN = "Open",
  PENDING = "Pending",
  ESCALATED = "Escalated",
  RESOLVED = "Resolved",
  CLOSED = "Closed",
}

export enum TicketPriority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  URGENT = "Urgent",
}

export interface ITicketResponse {
  message: string;
  sender: Types.ObjectId;
  createdAt?: Date;
}

export interface ISupportTicket {
  ticketId: string; // e.g., TCK-10293
  user: Types.ObjectId;
  organizationId: Types.ObjectId | null;
  category: string; // e.g., Billing Information, Technical Support
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  responses: ITicketResponse[];
  createdAt?: Date;
  updatedAt?: Date;
}