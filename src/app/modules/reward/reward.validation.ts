import { z } from "zod";
import { RewardStatus } from "./reward.interface";

const createRewardZodSchema = z.object({
  name: z.string().min(2, "Reward name must be at least 2 characters"),
  category: z.string().min(2, "Category is required"),
  points: z.coerce.number().min(1, "Points required must be at least 1"),
  stock: z.coerce.number().min(0, "Stock cannot be negative"),
  status: z.nativeEnum(RewardStatus).optional(),
  description: z.string().optional(),
  image: z.string().optional(),
});

const updateRewardZodSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().optional(),
  points: z.coerce.number().min(1).optional(),
  stock: z.coerce.number().min(0).optional(),
  status: z.nativeEnum(RewardStatus).optional(),
  description: z.string().optional(),
  image: z.string().optional(),
});

export const RewardValidation = {
  createRewardZodSchema,
  updateRewardZodSchema
};