import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import {
  createPlanZodSchema,
  updatePlanZodSchema,
} from "./plan.validation";
import { PlanControllers } from "./plan.controller";
import { Role } from "../user/user.interface";

const router = Router();

router.post(
  "/",
  checkAuth(Role.SUPER_ADMIN), // ✅ only platform owner
  validateRequest(createPlanZodSchema),
  PlanControllers.createPlan
);

router.get("/", PlanControllers.getAllPlans);
router.get("/:id", PlanControllers.getPlanById);

router.patch(
  "/:id",
  checkAuth(Role.SUPER_ADMIN), // ❌ tenant admin cannot
  validateRequest(updatePlanZodSchema),
  PlanControllers.updatePlan
);

router.delete(
  "/:id",
  checkAuth(Role.SUPER_ADMIN),
  PlanControllers.deletePlan
);

export const PlanRoutes = router;