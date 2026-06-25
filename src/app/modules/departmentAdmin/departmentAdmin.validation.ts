import { z } from "zod";

export const DeptAdminValidation = {

      email: z.string().email(),
      name: z.string(),
      department: z.string(),
      assignedBudget: z.number().min(0)

};