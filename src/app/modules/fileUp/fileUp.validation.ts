import { z } from "zod";

export const uploadFileValidationSchema = z.object({
  body: z.object({
    folder: z.string().optional(),
  }),
});

export const deleteFileValidationSchema = z.object({
  key: z.string({
    message: "File key is required",
  }),
});