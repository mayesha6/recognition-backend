import { z } from "zod"

const sendRecognitionValidation = z.object({
  receiverEmail: z.string().email(),

    category: z.string({
      message: "Category is required"
    }),

    tone: z.string({
      message: "Tone is required"
    }),

    value: z.string({
      message: "Value is required"
    }),

    points: z.number().min(1),

    message: z.string({
      message: "Message is required"
    })
})

export const RecognitionValidation = {
  sendRecognitionValidation
}