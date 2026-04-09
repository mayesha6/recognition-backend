import { Router } from "express"
import { CategoryController } from "./category.controller"
import { checkAuth } from "../../middlewares/checkAuth"
import { FileTypes, upload } from "../../config/S3Client.config"

const router = Router()

router.post(
    "/create",
    checkAuth("ADMIN", "SUPER_ADMIN"),
    CategoryController.createCategory
)

router.get( 
    "/",
    // checkAuth("ADMIN", "SUPER_ADMIN", "USER"),
    CategoryController.getCategories
)

router.post(
    "/:id/images",
    checkAuth("ADMIN", "SUPER_ADMIN"),

    upload({
        folder: "CategoryImages",
        fileType: FileTypes.IMAGE,
        maxCount: 10
    }),

    CategoryController.addImages
)



router.patch(
    "/update-category/:id",
    checkAuth("ADMIN", "SUPER_ADMIN"),
    CategoryController.updateCategory
)
router.delete(
    "/delete-category/:id",
    checkAuth("ADMIN", "SUPER_ADMIN"),
    CategoryController.deleteCategory
)

router.delete(
    "/image",
    checkAuth("ADMIN", "SUPER_ADMIN"),
    CategoryController.deleteImage
)

export const CategoryRoutes = router