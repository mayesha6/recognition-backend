import { Router } from "express";
import { PointsController } from "./points.controller";
import { checkAuth } from "../../middlewares/checkAuth";

const router = Router();

// router.post("/send", PointsController.createTransaction); // send points
router.get(
    "/transactions/:email", 
    checkAuth("ADMIN", "SUPER_ADMIN"),
    PointsController.getUserTransactions
); // history
router.get(
    "/my-transactions", 
    checkAuth("ADMIN", "SUPER_ADMIN", "USER"),
    PointsController.getMyTransactions
); // history
router.get(
    "/balance/:email", 
    checkAuth("ADMIN", "SUPER_ADMIN"), 
    PointsController.getUserBalance
); // current points
router.get(
    "/my-balance", 
    checkAuth("ADMIN", "SUPER_ADMIN", "USER"), 
    PointsController.getMyBalance
); // current points

export const PointsRoutes = router;