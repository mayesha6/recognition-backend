import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { Tone } from "./tone.model";

const createTone = async (payload: any) => {
  const tone = await Tone.create(payload);
  return tone;
};

const getTones = async () => {
  return await Tone.find();
};

const updateTone = async (id: string, payload: any) => {
  const tone = await Tone.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!tone) {
    throw new AppError(httpStatus.NOT_FOUND, "tone not found");
  }

  return tone;
};

const deleteTone = async (id: string) => {
  const tone = await Tone.findByIdAndDelete(id);

  if (!tone) {
    throw new AppError(httpStatus.NOT_FOUND, "tone not found");
  }

  return tone;
};

export const ToneService = {
  createTone,
  getTones,
  updateTone,
  deleteTone,
};