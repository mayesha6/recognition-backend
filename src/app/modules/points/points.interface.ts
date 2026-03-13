import { Types } from "mongoose";

export type Types = "RECOGNITION" | "REDEEM" | "ADJUSTMENT"
export type Status = "PENDING" | "COMPLETED" | "FAILED";

export interface IPointsTransaction {
  _id?: Types.ObjectId;
  senderEmail: string;       
  receiverEmail: string;     
  points: number;           
  description?: string;   
  type: Types;    
  status: Status;    
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserPoints {
  email: string;
  totalPoints: number;
}