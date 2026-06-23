import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface"; // Assuming your Role enum is here
import { RecognitionValueController } from "./recognitionValue.controller";

const router = Router();

router.post(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  RecognitionValueController.createRecognitionValue
);

router.get(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN, Role.USER),
  RecognitionValueController.getRecognitionValues
);

router.patch(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  RecognitionValueController.updateRecognitionValue
);

router.delete(
  "/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  RecognitionValueController.deleteRecognitionValue
);

export const RecognitionValueRoutes = router;