import { Router } from "express";
import { WalletController } from "./wallet.controller";
import { checkAuth } from "../../middlewares/checkAuth";

const router = Router();

router.get(
    "/:userId",
    checkAuth("ADMIN", "SUPER_ADMIN"),
    WalletController.getWallet
)
router.post(
    "/distribute",
    checkAuth("ADMIN", "SUPER_ADMIN"),
    WalletController.distributePoints
)
router.post(
  "/reset",
  checkAuth("ADMIN", "SUPER_ADMIN"),
  WalletController.resetPoints
);

router.post(
  "/set-user-points",
  checkAuth("ADMIN", "SUPER_ADMIN"),
  WalletController.setUserPoints
);
export const WalletRoutes = router;
