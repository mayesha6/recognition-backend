import { Router } from "express";
import { DeptAdminControllers } from "./departmentAdmin.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = Router();

router.post(
    "/", 
    checkAuth(Role.ORGANIZATION_ADMIN), 
    DeptAdminControllers.createDeptAdmin
);
router.get(
    "/", 
    checkAuth(Role.ORGANIZATION_ADMIN), 
    DeptAdminControllers.getAllDeptAdmins
);

export const DeptAdminRoutes = router;