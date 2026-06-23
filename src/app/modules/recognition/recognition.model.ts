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
    recipient_name: {
      type: String
    },

    image: {
      type: String,
      required: true
    },

    recognition_values: [{
      type: String,
      required: true
    }],

    points: {
      type: Number,
      required: true
    },

    message: {
      type: String,
      required: true
    },
    messageId: {
      type: String,
      required: false
    },
    additionalMessage: {
      type: String,
      required: false
    },

  },
  {
    timestamps: true
  }
)

export const Recognition = model<IRecognition>(
  "Recognition",
  recognitionSchema
)