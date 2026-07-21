import { z } from "zod";
import { TicketPriority, TicketStatus } from "./support.interface";

const createTicketValidation = z.object({

  category: z.string().min(2, "Category is required"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.nativeEnum(TicketPriority).optional(),

});

const respondTicketValidation = z.object({

  message: z.string().min(2, "Response message is required").optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),

});

export const SupportValidation = {
  createTicketValidation,
  respondTicketValidation,
};