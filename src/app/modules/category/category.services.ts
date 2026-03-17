import httpStatus from "http-status-codes";
import { Category } from "./category.model";
import AppError from "../../errorHelpers/AppError";

const createCategory = async (payload: any) => {
  const category = await Category.create(payload);
  return category;
};

const getCategories = async () => {
  return await Category.find();
};

const updateCategory = async (id: string, payload: any) => {
  const category = await Category.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  return category;
};

const deleteCategory = async (id: string) => {
  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  return category;
};

const addImages = async (categoryId: string, images: string[]) => {
  const category = await Category.findByIdAndUpdate(
    categoryId,
    {
      $push: {
        images: { $each: images },
      },
    },
    { new: true }
  );

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  return category;
};

const deleteImage = async (categoryId: string, imageUrl: string) => {
  const category = await Category.findByIdAndUpdate(
    categoryId,
    {
      $pull: {
        images: imageUrl,
      },
    },
    { new: true }
  );

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

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