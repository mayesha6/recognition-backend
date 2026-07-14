import { Router } from "express"
import { UserRoutes } from "../modules/user/user.routes"
import { AuthRoutes } from "../modules/auth/auth.routes"
import { OtpRoutes } from "../modules/otp/otp.routes"
import { RecognitionRoutes } from "../modules/recognition/recognition.routes"
import { PointsRoutes } from "../modules/points/points.routes"
import { DashboardRoutes } from "../modules/dashboard/dashboard.routes"
import { WalletRoutes } from "../modules/wallet/wallet.routes"
import { CategoryRoutes } from "../modules/category/category.routes"
import { AiMessengerRoutes } from "../modules/aiMessenger/aiMessenger.route"
import { DepartmentRoutes } from "../modules/department/department.routes"
import { ToneRoutes } from "../modules/tone/tone.routes"
import { RecognitionValueRoutes } from "../modules/recognitionValue/recognitionValue.routes"
import { RewardRoutes } from "../modules/reward/reward.route"
import { RedeemRoutes } from "../modules/redeem/redeem.route"
import { PlanRoutes } from "../modules/plan/plan.routes"
import { SubscriptionRoutes } from "../modules/subscription/subscription.routes"


export const router = Router()

const moduleRoutes = [
    {
        path: "/auth",
        route: AuthRoutes
    },
    {
        path: "/otp",
        route: OtpRoutes
    },
    {
        path: "/user",
        route: UserRoutes
    },
    {
        path: "/recognition",
        route: RecognitionRoutes
    },
    {
        path: "/points",
        route: PointsRoutes
    },
    {
        path: "/wallet",
        route: WalletRoutes
    },
    {
        path: "/admin",
        route: DashboardRoutes
    },
    {
        path: "/category",
        route: CategoryRoutes
    },
    {
        path: "/department",
        route: DepartmentRoutes
    },
    {
        path: "/tone",
        route: ToneRoutes
    },
    {
        path: "/recognition-value",
        route: RecognitionValueRoutes
    },
    {
        path: "/ai",
        route: AiMessengerRoutes
    },
    {
        path: "/reward",
        route: RewardRoutes
    },
    {
        path: "/redeem",
        route: RedeemRoutes
    },
    {
        path: "/plan",
        route: PlanRoutes
    },
    {
        path: "/subscription",
        route: SubscriptionRoutes
    },



]

moduleRoutes.forEach((route) => {
    router.use(route.path, route.route)
})

