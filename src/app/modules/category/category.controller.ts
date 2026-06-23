import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { CategoryService } from "./category.services";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await CategoryService.createCategory(req.body, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Category created",
    data: result,
  });
});

const getCategories = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await CategoryService.getCategories(user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Categories fetched",
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = req.user as JwtPayload;
  const result = await CategoryService.updateCategory(id, req.body, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category updated",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = req.user as JwtPayload;
  await CategoryService.deleteCategory(id, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category deleted",
    data: null,
  });
});

const addImages = catchAsync(async (req: Request, res: Response) => {
  const categoryId = req.params.id;
  const files = req.files as Express.MulterS3.File[];
  const user = req.user as JwtPayload;

  const imageUrls = files.map((file) => file.location);
  const result = await CategoryService.addImages(categoryId, imageUrls, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Images added",
    data: result,
  });
});

const deleteImage = catchAsync(async (req: Request, res: Response) => {
  const { categoryId, imageUrl } = req.body;
  const user = req.user as JwtPayload;

  const result = await CategoryService.deleteImage(categoryId, imageUrl, user);

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