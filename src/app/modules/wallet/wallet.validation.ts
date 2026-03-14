import { z } from "zod"

export const createWalletValidation = z.object({
    user: z.string(),
    year: z.number(),
    quarter: z.number(),
    pointsAllocated: z.number()
})