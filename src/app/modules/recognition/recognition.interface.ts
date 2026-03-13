export type RecognitionStatus = "DRAFT" | "SENT"

export interface IRecognition {
  senderEmail: string
  receiverEmail: string

  category: string
  tone: string
  value: string

  points: number
  message: string

  status: RecognitionStatus

  createdAt?: Date
  updatedAt?: Date
}