import { z } from "zod";
import { PLAN_INTERVAL } from "./plan.constant";

const productAccessSchema = z.object({
  product: z.string(), // ObjectId
  fileAccess: z.enum(["basic", "pro", "vip"]),
});

const accessSchema = z.object({
  products: z.array(productAccessSchema).optional(),
  courses: z.array(z.string()).optional(),
  bundles: z.array(z.string()).optional(),
});

export const createPlanZodSchema = z.object({
  name: z.string().min(3).max(50),
  price: z.number().min(0),
  currency: z.string().min(3).max(5).optional(),
  interval: z.enum(PLAN_INTERVAL),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
access: accessSchema.optional(),
});

export const updatePlanZodSchema = z.object({
  name: z.string().min(3).max(50).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().min(3).max(5).optional(),
  interval: z.enum(PLAN_INTERVAL).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
access: accessSchema.optional(),
});