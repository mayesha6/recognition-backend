import { Schema, model, Types } from "mongoose";
import { IAiMessage } from "./aiMessenger.interface";
import { RecognitionStatus } from "../recognition/recognition.interface";
// import { CategoryName } from "../category/category.interface";
// import { RecognitionValues, Tone } from "../recognition/recognition.interface";



const aiMessageSchema = new Schema<IAiMessage>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        recipient_name: {
            type: String,
            required: true
        },
        // sender_name: {
        //     type: String,
        //     required: true
        // },
        generated_message: {
            type: String,
            required: true
        },

        department: {
            type: String,
            // enum: Object.values(Department),
            required: true,
        },

        category: {
            type: String,
            // enum: Object.values(CategoryName),
            required: true
        },

        tone: {
            type: String,
            // enum: Object.values(Tone),
            required: true
        },

        recognition_values: [{
            type: String,
            // enum: Object.values(RecognitionValues),
            required: true
        }],

        status: {
            type: String,
            enum: Object.values(RecognitionStatus),
            default: RecognitionStatus.SENT
        }
    },
    { timestamps: true }
);

aiMessageSchema.index({ user: 1, createdAt: -1 });

export const AiMessage = model<IAiMessage>("AiMessage", aiMessageSchema);