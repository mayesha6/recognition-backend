import { Router } from "express"
import { UserRoutes } from "../modules/user/user.routes"
import { AuthRoutes } from "../modules/auth/auth.routes"
import { OtpRoutes } from "../modules/otp/otp.routes"
import { FileRoutes } from "../modules/fileUp/fileUp.routes"
import { RecognitionRoutes } from "../modules/recognition/recognition.routes"
import { PointsRoutes } from "../modules/points/points.routes"
import { DashboardRoutes } from "../modules/dashboard/dashboard.routes"
import { WalletRoutes } from "../modules/wallet/wallet.routes"


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
        path: "/file",
        route: FileRoutes
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
        path: "/dashboard",
        route: DashboardRoutes
    },



]

moduleRoutes.forEach((route) => {
    router.use(route.path, route.route)
})

