import { Schema, model } from "mongoose"
import { IRecognitionValue } from "./recognitionValue.interface"

const recognitionValueSchema = new Schema<IRecognitionValue>({
  name: {
    type: String,
    // enum: Object.values(CategoryName),
    required: true,
    unique: true
  },


}, { timestamps: true })

export const RecognitionValue = model<IRecognitionValue>(
  "RecognitionValue",
  recognitionValueSchema
)