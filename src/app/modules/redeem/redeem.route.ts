import { Router } from "express";
import { RedeemControllers } from "./redeem.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { RedeemValidation } from "./redeem.validation";
import { Role } from "../user/user.interface";

const router = Router();

router.post(
  "/",
  checkAuth(Role.USER, Role.DEPARTMENT_ADMIN, Role.ORGANIZATION_ADMIN),
  validateRequest(RedeemValidation.createClaimValidation),
  RedeemControllers.createClaim
);

router.get(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN, Role.USER),
  RedeemControllers.getClaims
);

router.get(
  "/stats",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN),
  RedeemControllers.getClaimStats
);

router.patch(
  "/:id/status",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  validateRequest(RedeemValidation.updateClaimStatusValidation),
  RedeemControllers.updateClaimStatus
);

export const RedeemRoutes = router;