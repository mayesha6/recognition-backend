// recognition.interface.ts
import { Types } from "mongoose";

export enum RecognitionStatus {
  FAILED = "FAILED",
  PENDING = "PENDING",
  SENT = "SENT"
}

export interface IRecognition {
  senderEmail: string;
  receiverEmail: string;
  recipient_name: string;
  image: string;
  department: string;
  category: string;
  tone: string;
  recognition_values: string[];
  points: number;
  message: string;
  messageId?: string;
  additionalMessage?: string;
  status: RecognitionStatus;
  
  // 🔥 SaaS Tracking
  organizationId?: Types.ObjectId | null; 

  createdAt?: Date;
  updatedAt?: Date;
}