export type FileType = "image" | "video" | "pdf" | "any" | "audio";

export enum FileTypes {
  IMAGE = "image",
  VIDEO = "video",
  PDF = "pdf",
  AUDIO = "audio",
}

export interface IFileUpload {
  _id?: string;
  userId: string;
  conversationId?: string;
  messageId?: string;
  fileType: FileTypes;
  fileUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}