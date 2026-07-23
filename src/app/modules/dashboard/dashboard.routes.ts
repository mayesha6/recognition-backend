import express from "express"
import { DashboardController } from "./dashboard.controller"
import { checkAuth } from "../../middlewares/checkAuth"
import { Role } from "../user/user.interface"

const router = express.Router()

router.get(
    "/dashboard",
    checkAuth(Role.SUPER_ADMIN),
    DashboardController.getDashboard
)
router.get(
    "/org-dashboard",
    checkAuth(Role.ORGANIZATION_ADMIN),
    DashboardController.getOrgDashboard
)
router.get(
    "/reports",
    checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
    DashboardController.getReports
)

export const DashboardRoutes = router