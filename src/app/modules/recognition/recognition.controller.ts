import { Request, Response } from "express"
import httpStatus from "http-status-codes"
import { JwtPayload } from "jsonwebtoken"
import { catchAsync } from "../../utils/catchAsync"
import { RecognitionServices } from "./recognition.services"
import { sendResponse } from "../../utils/sendResponse"

const sendRecognition = catchAsync(async (req: Request, res: Response) => {

  const sender = req.user as JwtPayload
  const senderEmail = sender.email

  const result = await RecognitionServices.sendRecognition(
    senderEmail,
    req.body
  )

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Recognition sent successfully",
    data: result
  })
})

const getHistory = catchAsync(async (req: Request, res: Response) => {

  const user = req.user as JwtPayload;
  const email = user.email;

  const { meta, result } = await RecognitionServices.getRecognitionHistory(
    email,
    req.query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Recognition history retrieved",
    meta,
    data: result
  });
});

export const RecognitionControllers = {
  sendRecognition,
  getHistory
}