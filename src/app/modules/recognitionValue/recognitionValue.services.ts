import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { JwtPayload } from "jsonwebtoken";
import { Role } from "../user/user.interface";
import { RecognitionValue } from "./recognitionValue.model";

const createRecognitionValue = async (payload: any, user: JwtPayload) => {
  let organizationId = null;

  if (user.role === Role.ORGANIZATION_ADMIN) {
    organizationId = user.userId;
  }

  // Prevent creating duplicate recognition values within the same organization context
  const existingRecognitionValue = await RecognitionValue.findOne({ name: payload.name, organizationId });
  if (existingRecognitionValue) {
    throw new AppError(httpStatus.BAD_REQUEST, "Recognition value with this name already exists");
  }

  const recognitionValue = await RecognitionValue.create({
    ...payload,
    organizationId,
    createdBy: user.userId,
  });

  return recognitionValue;
};

const getRecognitionValues = async (user: JwtPayload) => {
  const filter: any = {};

  const orgId = user.organizationId || (user.role === Role.ORGANIZATION_ADMIN ? user.userId : null);

  if (orgId) {
    // অর্গানাইজেশনের আন্ডারে থাকা ইউজাররা শুধুমাত্র অর্গানাইজেশন এডমিনের ক্রিয়েট করা ভ্যালু দেখবে
    filter.organizationId = orgId;
  } else {
    // ইন্ডিভিজুয়াল টাইপ ইউজার এবং সুপার এডমিনরা সুপার এডমিনের ক্রিয়েট করা গ্লোবাল ভ্যালু দেখবে
    filter.organizationId = null;
  }

  return await RecognitionValue.find(filter).sort({ createdAt: -1 });
};

const updateRecognitionValue = async (id: string, payload: any, user: JwtPayload) => {
  const recognitionValue = await RecognitionValue.findById(id);

  if (!recognitionValue) {
    throw new AppError(httpStatus.NOT_FOUND, "Recognition value not found");
  }

  // Isolation check: Ensure user can only update their own level's recognition value
  if (user.role === Role.SUPER_ADMIN && recognitionValue.organizationId !== null) {
    throw new AppError(httpStatus.FORBIDDEN, "Super Admin can only modify global recognition values");
  }

  if (user.role === Role.ORGANIZATION_ADMIN) {
    if (!recognitionValue.organizationId || recognitionValue.organizationId.toString() !== user.userId.toString()) {
      throw new AppError(httpStatus.FORBIDDEN, "You cannot modify this recognition value");
    }
  }

  const updatedRecognitionValue = await RecognitionValue.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return updatedRecognitionValue;
};

const deleteRecognitionValue = async (id: string, user: JwtPayload) => {
  const recognitionValue = await RecognitionValue.findById(id);

  if (!recognitionValue) {
    throw new AppError(httpStatus.NOT_FOUND, "Recognition value not found");
  }

  // Isolation check: Ensure user can only delete their own level's recognition value
  if (user.role === Role.SUPER_ADMIN && recognitionValue.organizationId !== null) {
    throw new AppError(httpStatus.FORBIDDEN, "Super Admin can only delete global recognition values");
  }

  if (user.role === Role.ORGANIZATION_ADMIN) {
    if (!recognitionValue.organizationId || recognitionValue.organizationId.toString() !== user.userId.toString()) {
      throw new AppError(httpStatus.FORBIDDEN, "You cannot delete this recognition value");
    }
  }

  await RecognitionValue.findByIdAndDelete(id);

  return recognitionValue;
};

export const RecognitionValueService = {
  createRecognitionValue,
  getRecognitionValues,
  updateRecognitionValue,
  deleteRecognitionValue,
};