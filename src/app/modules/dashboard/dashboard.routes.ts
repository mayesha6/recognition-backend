import express from "express"
import { DashboardController } from "./dashboard.controller"
import { checkAuth } from "../../middlewares/checkAuth"

const router = express.Router()

router.get(
    "/",
    checkAuth("ADMIN", "SUPER_ADMIN"),
    DashboardController.getDashboard
)

export const DashboardRoutes = router