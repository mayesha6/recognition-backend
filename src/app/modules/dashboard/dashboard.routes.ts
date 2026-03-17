import express from "express"
import { DashboardController } from "./dashboard.controller"
import { checkAuth } from "../../middlewares/checkAuth"

const router = express.Router()

router.get(
    "/dashboard",
    checkAuth("ADMIN", "SUPER_ADMIN"),
    DashboardController.getDashboard
)
router.get(
    "/reports",
    checkAuth("ADMIN", "SUPER_ADMIN"),
    DashboardController.getReports
)

export const DashboardRoutes = router