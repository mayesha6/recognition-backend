import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { ToneController } from "./tone.controller";
import { Role } from "../user/user.interface"; // Assuming your Role enum is here

const router = Router();

router.post(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  ToneController.createTone
);

router.get(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN, Role.USER),
  ToneController.getTones
);

router.patch(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  ToneController.updateTone
);

router.delete(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  ToneController.deleteTone
);

export const ToneRoutes = router;