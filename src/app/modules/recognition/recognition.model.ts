import { Schema, model } from "mongoose"
import { IRecognition, RecognitionStatus } from "./recognition.interface"
// import { Department } from "../user/user.interface"
// import { CategoryName } from "../category/category.interface"

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

    // department: {
    //   type: String,
    //   // enum: Object.values(Department),
    //   required: true,
    // },

    // category: {
    //   type: String,
    //   // enum: Object.values(CategoryName),
    //   required: true
    // },

    // tone: {
    //   type: String,
    //   // enum: Object.values(Tone),
    //   required: true
    // },

    recognition_values: [{
      type: String,
      // enum: Object.values(RecognitionValues),
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