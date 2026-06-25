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

router.patch("/:id", 
    checkAuth(Role.ORGANIZATION_ADMIN), 
    DeptAdminControllers.updateDeptAdmin
);
router.delete("/:id", 
    checkAuth(Role.ORGANIZATION_ADMIN), 
    DeptAdminControllers.deleteDeptAdmin
);

export const DeptAdminRoutes = router;