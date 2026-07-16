import httpStatus from "http-status-codes";
import { Category } from "./category.model";
import AppError from "../../errorHelpers/AppError";
import { JwtPayload } from "jsonwebtoken";
import { Role } from "../user/user.interface";
import { deleteFileFromS3 } from "../../config/S3Client.config";
import { envVars } from "../../config/env";

const createCategory = async (payload: any, user: JwtPayload) => {
  let organizationId = null;

  if (user.role === Role.ORGANIZATION_ADMIN) {
    organizationId = user.userId;
  }

  const existingCategory = await Category.findOne({ name: payload.name, organizationId });
  if (existingCategory) {
    throw new AppError(httpStatus.BAD_REQUEST, "Category with this name already exists");
  }

  const category = await Category.create({
    ...payload,
    organizationId,
    createdBy: user.userId,
  });

  return category;
};

const getCategories = async (user: JwtPayload) => {
  const filter: any = {};

  const orgId = user.organizationId || (user.role === Role.ORGANIZATION_ADMIN ? user.userId : null);

  if (orgId) {
    // অর্গানাইজেশনের আন্ডারে থাকা ইউজাররা শুধুমাত্র অর্গানাইজেশন এডমিনের ক্রিয়েট করা ক্যাটাগরি দেখবে
    filter.organizationId = orgId;
  } else {
    // ইন্ডিভিজুয়াল টাইপ ইউজার এবং সুপার এডমিনরা সুপার এডমিনের ক্রিয়েট করা গ্লোবাল ক্যাটাগরি দেখবে
    filter.organizationId = null;
  }

  return await Category.find(filter).sort({ createdAt: -1 });
};

// Helper function to check authorization
const verifyCategoryAccess = async (categoryId: string, user: JwtPayload) => {
  const category = await Category.findById(categoryId);
  if (!category) throw new AppError(httpStatus.NOT_FOUND, "Category not found");

  if (user.role === Role.SUPER_ADMIN && category.organizationId !== null) {
    throw new AppError(httpStatus.FORBIDDEN, "Super Admin can only modify global categories");
  }

  if (user.role === Role.ORGANIZATION_ADMIN) {
    if (!category.organizationId || category.organizationId.toString() !== user.userId) {
      throw new AppError(httpStatus.FORBIDDEN, "You cannot modify this organization's category");
    }
  }

  return category;
};

const updateCategory = async (id: string, payload: any, user: JwtPayload) => {
  await verifyCategoryAccess(id, user);

  const category = await Category.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return category;
};

const deleteCategory = async (id: string, user: JwtPayload) => {
  await verifyCategoryAccess(id, user);

  // Optional: If you want to delete images from S3 when a category is deleted
  const category = await Category.findById(id);
  category?.images.forEach(async (url) => {
    const key = url.split(`/${envVars.S3.S3_BUCKET_NAME}/`)[1];
    if (key) await deleteFileFromS3(key);
  });

  return await Category.findByIdAndDelete(id);
};

const addImages = async (categoryId: string, images: string[], user: JwtPayload) => {
  await verifyCategoryAccess(categoryId, user);

  const category = await Category.findByIdAndUpdate(
    categoryId,
    { $push: { images: { $each: images } } },
    { new: true }
  );

  return category;
};

const deleteImage = async (categoryId: string, imageUrl: string, user: JwtPayload) => {
  await verifyCategoryAccess(categoryId, user);

  const category = await Category.findByIdAndUpdate(
    categoryId,
    { $pull: { images: imageUrl } },
    { new: true }
  );

  // Optional: Remove file from S3 physically
  const key = imageUrl.split(`/${envVars.S3.S3_BUCKET_NAME}/`)[1];
  if (key) await deleteFileFromS3(key);

  return category;
};

export const CategoryService = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  addImages,
  deleteImage,
};