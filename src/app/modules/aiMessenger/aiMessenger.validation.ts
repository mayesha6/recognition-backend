import { z } from "zod";

export const regenerateSchema = z.object({
    category: z.string(),
    department: z.string(),
    recipient_name: z.string(),
    recognition_values: z.array(z.string()).min(1),
    // sender_name: z.string(),
    tone: z.string(),
    userPrompt: z.string().optional()
});


export const editMessageSchema = z.object({
    messageId: z.string({ message: "Message ID is required" }),
    newMessage: z.string().optional(),
    message: z.string().optional()
}).refine(data => data.newMessage || data.message, {
    message: "Either 'newMessage' or 'message' is required for editing",
});