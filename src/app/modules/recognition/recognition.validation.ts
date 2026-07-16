import { z } from "zod"

const sendRecognitionValidation = z.object({
  receiverEmail: z.string().email(),
  image: z.string({
    message: "Image is required"
  }),
  points: z.number().min(1, "Points must be at least 1 to send recognition"),
  message: z.string({
    message: "Message is required"
  }).optional(),
  messageId: z.string().optional(),
  additionalMessage: z.string({
    message: "Additional message is required"
  }).optional(),
})

export const RecognitionValidation = {
  sendRecognitionValidation
}