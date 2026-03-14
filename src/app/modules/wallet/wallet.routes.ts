import { Router } from "express";
import { WalletController } from "./wallet.controller";

const router = Router();

router.get("/:userId", WalletController.getWallet)


export const UserRoutes = router;
