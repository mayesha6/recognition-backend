import { z } from "zod";

export const regenerateSchema = z.object({
    body: z.object({
        category: z.string(),
        department: z.string(),
        recipient_name: z.string(),
        recognition_values: z.array(z.string()).min(1),
        sender_name: z.string(),
        tone: z.number()
    })
});