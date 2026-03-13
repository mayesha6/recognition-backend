import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { OTPService } from "./otp.service";
import httpStatus from 'http-status-codes';

const verifySignupOtp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;

    const user = await OTPService.verifySignupOtp(email, otp);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "OTP verified successfully",
      data: {
        id: user._id,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  }
);

const resendOtp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const result = await OTPService.resendOtp(email);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: result.message,
      data: null,
    });
  }
);

const verifyResetOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const resetToken = await OTPService.verifyResetOtp(email, otp);

  res.cookie("resetToken", resetToken, {
    httpOnly: true,
    secure: false, // production e true
    sameSite: "lax",
    maxAge: 10 * 60 * 1000, // 10 min
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: {
      resetToken,
    },
  });
});
export const OTPController = {
  verifySignupOtp,
  resendOtp,
  verifyResetOtp
};
