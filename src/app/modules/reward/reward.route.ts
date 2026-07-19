import { Router } from "express";
import { RewardControllers } from "./reward.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { RewardValidation } from "./reward.validation";
import { Role } from "../user/user.interface";
import { parseFormDataMiddleware } from "../../middlewares/parseFormDataMiddleware";
import { FileTypes, upload } from "../../config/S3Client.config";

const router = Router();

router.post(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  upload({
    folder: "RewardImage",
    fileType: FileTypes.IMAGE,
    maxCount: 1,
  }),
  parseFormDataMiddleware,
  validateRequest(RewardValidation.createRewardZodSchema),
  RewardControllers.createReward
);

router.get(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN, Role.USER),
  RewardControllers.getAllRewards
);

router.patch(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  upload({
    folder: "RewardImage",
    fileType: FileTypes.IMAGE,
    maxCount: 1,
  }),
  parseFormDataMiddleware,
  validateRequest(RewardValidation.updateRewardZodSchema),
  RewardControllers.updateReward
);

router.delete(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  RewardControllers.deleteReward
);

export const RewardRoutes = router;