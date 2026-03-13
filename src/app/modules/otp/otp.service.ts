import crypto from "crypto";
import { redisClient } from "../../config/redis.config";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { envVars } from "../../config/env";
import jwt from "jsonwebtoken";
import httpStatus from "http-status-codes";
import { sendEmail } from "../../utils/sendEmail";

// const OTP_EXPIRATION = 2 * 60 // 2minute

export const generateOtp = (length = 6) => {
    //6 digit otp
    const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString()
    return otp
}

const verifySignupOtp = async (email: string, otp: number) => {
  // Step 1: find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Step 2: get OTP from Redis
  const redisKey = `otp:${email}`;
  const storedOtp = await redisClient.get(redisKey);

  if (!storedOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP has expired or does not exist.");
  }

  if (Number(storedOtp) !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  // Step 3: OTP is valid → delete from Redis
  await redisClient.del(redisKey);

  // Step 4: mark user as verified (optional)
  user.isVerified = true;
  await user.save();

  return user;
};

const resendOtp = async (email: string) => {
  // Step 1: find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Step 2: generate new OTP
  const otp = generateOtp();

  // Step 3: save OTP in Redis with expiry (2 minutes)
  const redisKey = `otp:${email}`;
  await redisClient.set(redisKey, otp, { expiration: { type: "EX", value: 120 } });

  // Step 4: send OTP via email
  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    templateName: "otp",
    templateData: {
      name: user.name,
      otp,
    },
  });

  return { message: "OTP resent successfully" };
};

const verifyResetOtp = async (email: string, otp: string) => {
  const redisKey = `otp:reset:${email}`;

  const savedOtp = await redisClient.get(redisKey);

  if (!savedOtp) {
    throw new AppError(401, "OTP expired or invalid");
  }

  if (savedOtp !== otp) {
    throw new AppError(401, "Invalid OTP");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (!user.isVerified) {
    throw new AppError(401, "User is not verified");
  }

  const jwtPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  const resetToken = jwt.sign(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    { expiresIn: "10m" }
  );

  await redisClient.del([redisKey]);

  return resetToken;
};


export const OTPService = {
    generateOtp,
    verifySignupOtp,
    resendOtp,
    verifyResetOtp
}
