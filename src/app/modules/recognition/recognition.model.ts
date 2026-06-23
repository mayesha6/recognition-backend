// recognition.model.ts
import { Schema, model, Types } from "mongoose";
import { IRecognition, RecognitionStatus } from "./recognition.interface";

const recognitionSchema = new Schema<IRecognition>(
  {
    senderEmail: { type: String, required: true, index: true },
    receiverEmail: { type: String, required: true, index: true },
    recipient_name: { type: String },
    image: { type: String, required: true },
    recognition_values: [{ type: String, required: true }],
    points: { type: Number, required: true },
    message: { type: String, required: true },
    messageId: { type: String, required: false },
    additionalMessage: { type: String, required: false },
    department: { type: String },
    category: { type: String },
    tone: { type: String },
    status: {
      type: String,
      enum: Object.values(RecognitionStatus),
      default: RecognitionStatus.PENDING
    },
    // 🔥 SaaS Tracking
    organizationId: {
      type: Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

export const Recognition = model<IRecognition>("Recognition", recognitionSchema);