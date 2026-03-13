import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    url: String,
    key: String,
    size: Number,
    type: String,
  },
  { timestamps: true }
);

export const FileModel = mongoose.model("File", fileSchema);