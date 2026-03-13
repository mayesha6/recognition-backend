import { Schema, model } from "mongoose"
import { IRecognition } from "./recognition.interface"

const recognitionSchema = new Schema<IRecognition>(
  {
    senderEmail: {
      type: String,
      required: true,
      index: true
    },

    receiverEmail: {
      type: String,
      required: true,
      index: true
    },

    category: {
      type: String,
      required: true
    },

    tone: {
      type: String,
      required: true
    },

    value: {
      type: String,
      required: true
    },

    points: {
      type: Number,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["DRAFT", "SENT"],
      default: "SENT"
    }
  },
  {
    timestamps: true
  }
)

export const Recognition = model<IRecognition>(
  "Recognition",
  recognitionSchema
)