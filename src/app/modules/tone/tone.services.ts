import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { Tone } from "./tone.model";
import { JwtPayload } from "jsonwebtoken";
import { Role } from "../user/user.interface";

const createTone = async (payload: any, user: JwtPayload) => {
  let organizationId = null;

  if (user.role === Role.ORGANIZATION_ADMIN) {
    organizationId = user.userId;
  }

  // Prevent creating duplicate tones within the same organization context
  const existingTone = await Tone.findOne({ name: payload.name, organizationId });
  if (existingTone) {
    throw new AppError(httpStatus.BAD_REQUEST, "Tone with this name already exists");
  }

  const tone = await Tone.create({
    ...payload,
    organizationId,
    createdBy: user.userId,
  });

  return tone;
};

const getTones = async (user: JwtPayload) => {
  const filter: any = {};

  if (user.role === Role.SUPER_ADMIN) {
    // Super Admin শুধু গ্লোবাল টোন দেখবে
    filter.organizationId = null;
  } else {
    // Org Admin, Dept Admin, এবং Regular Users শুধু তাদের নিজ নিজ অর্গানাইজেশনের টোন দেখবে
    // গ্লোবাল ডাটা এখানে আসবে না
    filter.organizationId = user.organizationId || user.userId;
  }

  return await Tone.find(filter).sort({ createdAt: -1 });
};

const updateTone = async (id: string, payload: any, user: JwtPayload) => {
  const tone = await Tone.findById(id);

  if (!tone) {
    throw new AppError(httpStatus.NOT_FOUND, "Tone not found");
  }

  // Isolation check: Ensure user can only update their own level's tone
  if (user.role === Role.SUPER_ADMIN && tone.organizationId !== null) {
    throw new AppError(httpStatus.FORBIDDEN, "Super Admin can only modify global tones");
  }

  if (user.role === Role.ORGANIZATION_ADMIN) {
    if (!tone.organizationId || tone.organizationId.toString() !== user.userId) {
      throw new AppError(httpStatus.FORBIDDEN, "You cannot modify this tone");
    }
  }

  const updatedTone = await Tone.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return updatedTone;
};

const deleteTone = async (id: string, user: JwtPayload) => {
  const tone = await Tone.findById(id);

  if (!tone) {
    throw new AppError(httpStatus.NOT_FOUND, "Tone not found");
  }

  // Isolation check: Ensure user can only delete their own level's tone
  if (user.role === Role.SUPER_ADMIN && tone.organizationId !== null) {
    throw new AppError(httpStatus.FORBIDDEN, "Super Admin can only delete global tones");
  }

  if (user.role === Role.ORGANIZATION_ADMIN) {
    if (!tone.organizationId || tone.organizationId.toString() !== user.userId) {
      throw new AppError(httpStatus.FORBIDDEN, "You cannot delete this tone");
    }
  }

  await Tone.findByIdAndDelete(id);

  return tone;
};

export const ToneService = {
  createTone,
  getTones,
  updateTone,
  deleteTone,
};