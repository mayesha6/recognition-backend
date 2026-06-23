import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface"; // Assuming your Role enum is here
import { DepartmentController } from "./department.controller";

const router = Router();

router.post(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  DepartmentController.createDepartment
);

router.get(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN, Role.USER),
  DepartmentController.getDepartments
);

router.patch(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  DepartmentController.updateDepartment
);

router.delete(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  DepartmentController.deleteDepartment
);

export const DepartmentRoutes = router;