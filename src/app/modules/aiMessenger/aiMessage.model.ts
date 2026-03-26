import { Schema, model, Types } from "mongoose";
import { IAiMessage } from "./aiMessenger.interface";



const aiMessageSchema = new Schema<IAiMessage>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        category: { type: String, required: true },
        department: { type: String, required: true },
        recipient_name: { type: String, required: true },
        recognition_values: [{ type: String, required: true }],
        sender_name: { type: String, required: true },
        tone: { type: Number, required: true },
        generated_message: { type: String, required: true }
    },
    { timestamps: true }
);

aiMessageSchema.index({ user: 1, createdAt: -1 });

export const AiMessage = model<IAiMessage>("AiMessage", aiMessageSchema);