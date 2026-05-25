import { Router } from "express"
import { checkAuth } from "../../middlewares/checkAuth"
import { RecognitionValueController } from "./recognitionValue.controller"

const router = Router()

router.post(
    "/",
    checkAuth("ADMIN", "SUPER_ADMIN"),
    RecognitionValueController.createRecognitionValue
)

router.get( 
    "/",
    checkAuth("ADMIN", "SUPER_ADMIN", "USER"),
    RecognitionValueController.getRecognitionValues
)

router.patch(
    "/:id",
    checkAuth("ADMIN", "SUPER_ADMIN"),
    RecognitionValueController.updateRecognitionValue
)
router.delete(
    "/:id",
    checkAuth("ADMIN", "SUPER_ADMIN"),
    RecognitionValueController.deleteRecognitionValue
)

export const RecognitionValueRoutes = router