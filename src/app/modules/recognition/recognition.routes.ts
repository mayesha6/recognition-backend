import express from "express"
import { RecognitionControllers } from "./recognition.controller"
import { validateRequest } from "../../middlewares/validateRequest"
import { RecognitionValidation } from "./recognition.validation"
import { checkAuth } from "../../middlewares/checkAuth"


const router = express.Router()

router.post(
  "/send",
  checkAuth("SUPER_ADMIN", "ADMIN", "USER"),
  validateRequest(
    RecognitionValidation.sendRecognitionValidation
  ),
  RecognitionControllers.sendRecognition
)

router.get("/history", checkAuth("SUPER_ADMIN", "ADMIN", "USER"), RecognitionControllers.getHistory)

export const RecognitionRoutes = router