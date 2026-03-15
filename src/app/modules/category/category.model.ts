import { Schema, model } from "mongoose"
import { ICategory } from "./category.interface"

const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    unique: true
  },

  images: [
    {
      type: String
    }
  ]

}, { timestamps: true })

export const Category = model<ICategory>(
  "Category",
  categorySchema
)