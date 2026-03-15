export type RecognitionStatus = "FAILED" | "SENT"

export interface IRecognition {
  senderEmail: string
  receiverEmail: string

  image:string
  department: string
  category: string
  tone: string
  value: string

  points: number
  message: string

  status: RecognitionStatus

  createdAt?: Date
  updatedAt?: Date
}