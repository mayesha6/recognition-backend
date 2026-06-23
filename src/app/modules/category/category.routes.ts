import { Router } from "express";
import { CategoryController } from "./category.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { FileTypes, upload } from "../../config/S3Client.config";
import { Role } from "../user/user.interface";

const router = Router();

router.post(
  "/create",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  CategoryController.createCategory
);

router.get(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN, Role.USER),
  CategoryController.getCategories
);

router.post(
  "/:id/images",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  upload({
    folder: "CategoryImages",
    fileType: FileTypes.IMAGE,
    maxCount: 10,
  }),
  CategoryController.addImages
);

router.patch(
  "/update-category/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  CategoryController.updateCategory
);

router.delete(
  "/delete-category/:id",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  CategoryController.deleteCategory
);

router.delete(
  "/image",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  CategoryController.deleteImage
);

export const CategoryRoutes = router;