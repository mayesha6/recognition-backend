import { Router } from "express"
import { DepartmentController } from "./department.controller"
import { checkAuth } from "../../middlewares/checkAuth"

const router = Router()

router.post(
    "/",
    checkAuth("ADMIN", "SUPER_ADMIN"),
    DepartmentController.createDepartment
)

router.get( 
    "/",
    // checkAuth("ADMIN", "SUPER_ADMIN", "USER"),
    DepartmentController.getDepartments
)

router.patch(
    "/update-department/:id",
    checkAuth("ADMIN", "SUPER_ADMIN"),
    DepartmentController.updateDepartment
)
router.delete(
    "/delete-department/:id",
    checkAuth("ADMIN", "SUPER_ADMIN"),
    DepartmentController.deleteDepartment
)

export const DepartmentRoutes = router