import { Router } from "express";
import { PointsController } from "./points.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface"; // Role import করুন

const router = Router();

// admin/super_admin checking specific user
router.get(
    "/transactions/:email", 
    checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN),
    PointsController.getUserTransactions
); 
router.get(
    "/balance/:email", 
    checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN), 
    PointsController.getUserBalance
);

// user checking their own
router.get(
    "/my-transactions", 
    checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN, Role.USER),
    PointsController.getMyTransactions
); 
router.get(
    "/my-balance", 
    checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN, Role.USER), 
    PointsController.getMyBalance
); 


export const PointsRoutes = router;