import { z } from "zod"
import { Category, RecognitionValues, Tone } from "./recognition.interface"
import { Department } from "../user/user.interface"

const sendRecognitionValidation = z.object({
  receiverEmail: z.string().email(),
  image: z.string({
    message: "Image is required"
  }),
  department: z.enum(Object.values(Department) as [string, ...string[]]).optional(),
  category: z.enum(Object.values(Category) as [string, ...string[]]),

  tone: z.enum(Object.values(Tone) as [string, ...string[]]),

  value: z.enum(Object.values(RecognitionValues) as [string, ...string[]]),
  points: z.number().min(1),
  message: z.string({
    message: "Message is required"
  })
})

export const RecognitionValidation = {
  sendRecognitionValidation
}