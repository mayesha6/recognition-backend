import { Router } from "express"
import { checkAuth } from "../../middlewares/checkAuth"
import { ToneController } from "./tone.controller"

const router = Router()

router.post(
    "/",
    checkAuth("ADMIN", "SUPER_ADMIN"),
    ToneController.createTone
)

router.get( 
    "/",
    checkAuth("ADMIN", "SUPER_ADMIN", "USER"),
    ToneController.getTones
)

router.patch(
    "/:id",
    checkAuth("ADMIN", "SUPER_ADMIN"),
    ToneController.updateTone
)
router.delete(
    "/:id",
    checkAuth("ADMIN", "SUPER_ADMIN"),
    ToneController.deleteTone
)

export const ToneRoutes = router