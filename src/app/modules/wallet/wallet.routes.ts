import { Router } from "express";
import { WalletController } from "./wallet.controller";
import { checkAuth } from "../../middlewares/checkAuth";

const router = Router();

router.get(
    "/:userId", 
    checkAuth("ADMIN","SUPER_ADMIN"),
    WalletController.getWallet
)
router.post(
"/distribute",
checkAuth("ADMIN","SUPER_ADMIN"),
WalletController.distributePoints
)
export const WalletRoutes = router;
