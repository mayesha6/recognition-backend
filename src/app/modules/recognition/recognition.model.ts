import { Schema, model } from "mongoose"
import { IRecognition, RecognitionStatus, RecognitionValues, Tone } from "./recognition.interface"
import { Department } from "../user/user.interface"
import { CategoryName } from "../category/category.interface"

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

    image: {
      type: String,
      required: true
    },

    department: {
      type: String,
      enum: Object.values(Department),
      required: true,
    },

    category: {
      type: String,
      enum: Object.values(CategoryName),
      required: true
    },

    tone: {
      type: String,
      enum: Object.values(Tone),
      required: true
    },

    value: {
      type: String,
      enum: Object.values(RecognitionValues),
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
      enum: Object.values(RecognitionStatus),
      default: RecognitionStatus.SENT
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