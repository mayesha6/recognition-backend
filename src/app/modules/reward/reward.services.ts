import httpStatus from "http-status-codes";
import { Reward } from "./reward.model";
import AppError from "../../errorHelpers/AppError";
import { JwtPayload } from "jsonwebtoken";
import { QueryBuilder } from "../../utils/QueryBuiler";
import { Role } from "../user/user.interface";
import { deleteFileFromS3 } from "../../config/S3Client.config";
import { envVars } from "../../config/env";

const createReward = async (payload: any, user: JwtPayload) => {
  let organizationId = null;

  if (user.role === Role.ORGANIZATION_ADMIN) {
    organizationId = user.userId;
  }

  const existingReward = await Reward.findOne({ name: payload.name, organizationId });
  if (existingReward) {
    throw new AppError(httpStatus.BAD_REQUEST, "A reward with this name already exists in your catalog");
  }

  const reward = await Reward.create({
    ...payload,
    organizationId,
    createdBy: user.userId,
  });

  return reward;
};

const getAllRewards = async (user: JwtPayload, query: Record<string, string>) => {
  const filter: any = {};

  // SaaS Isolation Check
  if (user.role === Role.SUPER_ADMIN) {
    // Only global rewards if not specified, or can view all depending on use case.
    filter.organizationId = null; 
  } else if (user.role === Role.ORGANIZATION_ADMIN) {
    // Org Admin sees Global Rewards + Their Own Rewards
    filter.$or = [{ organizationId: null }, { organizationId: user.userId }];
  } else {
    // Users and Dept Admins see Global Rewards + Their Org's Rewards
    filter.$or = [{ organizationId: null }, { organizationId: user.organizationId }];
  }

  const queryBuilder = new QueryBuilder(Reward.find(filter), query)
    .search(["name", "category", "status"])
    .filter()
    .sort()
    .paginate();

  const data = await queryBuilder.build();
  const meta = await queryBuilder.getMeta();

  return { data, meta };
};

const verifyRewardAccess = async (id: string, user: JwtPayload) => {
  const reward = await Reward.findById(id);
  if (!reward) throw new AppError(httpStatus.NOT_FOUND, "Reward not found");

  if (user.role === Role.SUPER_ADMIN && reward.organizationId !== null) {
    throw new AppError(httpStatus.FORBIDDEN, "Super Admin can only modify global rewards");
  }

  if (user.role === Role.ORGANIZATION_ADMIN) {
    if (!reward.organizationId || reward.organizationId.toString() !== user.userId.toString()) {
      throw new AppError(httpStatus.FORBIDDEN, "You cannot modify this reward as it belongs to another organization or is a global reward.");
    }
  }

  return reward;
};

const updateReward = async (id: string, payload: any, user: JwtPayload) => {
  const reward = await verifyRewardAccess(id, user);

  // If a new image is provided, delete the old image from S3
  if (payload.image && reward.image) {
    const oldKey = reward.image.split(`/${envVars.S3.S3_BUCKET_NAME}/`)[1];
    if (oldKey) {
      try {
        await deleteFileFromS3(oldKey);
      } catch (err) {
        console.error("Failed to delete old image from S3:", err);
      }
    }
  }

  const updatedReward = await Reward.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return updatedReward;
};

const deleteReward = async (id: string, user: JwtPayload) => {
  const reward = await verifyRewardAccess(id, user);
  
  if (reward.image) {
    const key = reward.image.split(`/${envVars.S3.S3_BUCKET_NAME}/`)[1];
    if (key) {
      try {
        await deleteFileFromS3(key);
      } catch (err) {
        console.error("Failed to delete image from S3:", err);
      }
    }
  }

  return await Reward.findByIdAndDelete(id);
};

export const RewardServices = {
  createReward,
  getAllRewards,
  updateReward,
  deleteReward,
};