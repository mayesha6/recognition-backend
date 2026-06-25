import { Router } from "express";
import { WalletController } from "./wallet.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface"; // Adjust import path if needed

const router = Router();

router.get(
  "/:userId",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN),
  WalletController.getWallet
);

router.post(
  "/distribute",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN),
  WalletController.distributePoints
);

router.post(
  "/reset",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN), // Usually DAs shouldn't reset entire departments
  WalletController.resetPoints
);

router.post(
  "/set-user-points",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN),
  WalletController.setUserPoints
);

// wallet.route.ts

router.patch(
  "/update-budget",
  checkAuth(Role.ORGANIZATION_ADMIN), // latest update: restricted to Org Admin
  WalletController.updateDepartmentBudget
);
export const WalletRoutes = router;