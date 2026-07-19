import { z } from "zod";
import { ClaimStatus } from "./redeem.interface";

const createClaimValidation = z.object({
  rewardId: z.string({ message: "Reward ID is required" }),
});

const updateClaimStatusValidation = z.object({
  status: z.enum([ClaimStatus.APPROVED, ClaimStatus.REJECTED]),
});

export const RedeemValidation = {
  createClaimValidation,
  updateClaimStatusValidation,
};