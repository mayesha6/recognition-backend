import { Types } from "mongoose";
import { RecognitionStatus } from "../recognition/recognition.interface";

export interface IRegenerateInput {
    category: string;
    department: string;
    recipient_name: string;
    recognition_values: string[];
    // sender_name: string;
    tone: string;
    userPrompt?: string;
}

export interface IRegenerateResponse {
    message: string;
    department: string;
    category: string;
    tone: string;
    recipient_name: string;
    userPrompt?: string
}

export interface IAiMessage {
    user: Types.ObjectId;
    category: string;
    department: string;
    recipient_name: string;
    recognition_values: string[];
    sender_name: string;
    tone: string;
    generated_message: string;
    status: RecognitionStatus
    userPrompt?: string
}