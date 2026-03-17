import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { CategoryService } from "./category.services";
import httpStatus from "http-status-codes";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryService.createCategory(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Category created",
    data: result,
  });
});

const getCategories = catchAsync(async (req, res) => {
  const result = await CategoryService.getCategories();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Categories fetched",
    data: result,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  const id = req.params.id;

  const result = await CategoryService.updateCategory(id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category updated",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req, res) => {
  const id = req.params.id;

  await CategoryService.deleteCategory(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category deleted",
    data: null,
  });
});

const addImages = catchAsync(async (req, res) => {
  const categoryId = req.params.id;

  const files = req.files as Express.MulterS3.File[];

  const imageUrls = files.map((file) => file.location);

  const result = await CategoryService.addImages(categoryId, imageUrls);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Images added",
    data: result,
  });
});

const deleteImage = catchAsync(async (req, res) => {
  const { categoryId, imageUrl } = req.body;

  const result = await CategoryService.deleteImage(
    categoryId,
    imageUrl
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Image removed",
    data: result,
  });
});

export const CategoryController = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  addImages,
  deleteImage,
};