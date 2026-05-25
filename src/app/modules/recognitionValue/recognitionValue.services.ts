import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { RecognitionValue } from "./recognitionValue.model";

const createRecognitionValue= async (payload: any) => {
  const recognitionValue = await RecognitionValue.create(payload);
  return recognitionValue;
};

const getRecognitionValues = async () => {
  return await RecognitionValue.find();
};

const updateRecognitionValue = async (id: string, payload: any) => {
  const recognitionValue = await RecognitionValue.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!recognitionValue) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

  return recognitionValue;
};

const deleteRecognitionValue = async (id: string) => {
  const recognitionValue = await RecognitionValue.findByIdAndDelete(id);

  if (!recognitionValue) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

  return recognitionValue;
};

export const RecognitionValueService = {
  createRecognitionValue,
  getRecognitionValues,
  updateRecognitionValue,
  deleteRecognitionValue,
};