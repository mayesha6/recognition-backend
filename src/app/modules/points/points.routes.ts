import { Router } from "express";
import { PointsController } from "./points.controller";

const router = Router();

router.post("/send", PointsController.createTransaction); // send points
router.get("/transactions/:email", PointsController.getUserTransactions); // history
router.get("/balance/:email", PointsController.getUserBalance); // current points

export const pointsRoutes = router;