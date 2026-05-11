import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserControllers } from "./user.controller";
import { Role } from "./user.interface";
import { updateUserZodSchema } from "./user.validation";
import { parseFormDataMiddleware } from "../../middlewares/parseFormDataMiddleware";
import { FileTypes, upload } from "../../config/S3Client.config";

const router = Router();

router.post("/register", UserControllers.createUser);
router.get(
  "/all-users",
  UserControllers.getAllUsers
);
router.get("/me", checkAuth(...Object.values(Role)), UserControllers.getMe);
router.patch(
  "/update-my-profile",
  checkAuth(...Object.values(Role)),
  upload({
    folder: "UserImage",
    fileType: FileTypes.IMAGE,
    maxCount: 1,
  }),
  parseFormDataMiddleware,
  // validateRequest(updateUserZodSchema),
  UserControllers.updateMyProfile
);
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.getSingleUser
);
router.patch(
  "/:id",
  validateRequest(updateUserZodSchema),
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.updateUser
);
router.delete(
  "/delete-own-profile",
  checkAuth(...Object.values(Role)),
  UserControllers.deleteOwnAccount
);
router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.deleteUserById
);
router.delete(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.deleteAllUsers
);


export const UserRoutes = router;
