// recognition.route.ts
import express from "express";
import { RecognitionControllers } from "./recognition.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { RecognitionValidation } from "./recognition.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface"; // Use proper Roles

const router = express.Router();

router.post(
  "/send",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN, Role.USER),
  validateRequest(RecognitionValidation.sendRecognitionValidation),
  RecognitionControllers.sendRecognition
);

router.get(
  "/history", 
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN, Role.USER), 
  RecognitionControllers.getHistory
);

export const RecognitionRoutes = router;