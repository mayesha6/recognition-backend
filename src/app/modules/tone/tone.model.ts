import { Schema, model } from "mongoose"
import { ITone } from "./tone.interface"

const toneSchema = new Schema<ITone>({
  name: {
    type: String,
    // enum: Object.values(CategoryName),
    required: true,
    unique: true
  },


}, { timestamps: true })

export const Tone = model<ITone>(
  "Tone",
  toneSchema
)