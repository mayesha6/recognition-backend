import httpStatus from "http-status-codes"
import { Recognition } from "./recognition.model"
import { User } from "../user/user.model"
import AppError from "../../errorHelpers/AppError"
import { QueryBuilder } from "../../utils/QueryBuiler"
import { PointsTransaction } from "../points/points.model"

const sendRecognition = async (senderEmail: string, payload: any) => {

  const { receiverEmail, category, tone, value, points, message } = payload

  if (senderEmail === receiverEmail) {
    throw new AppError(400, "You cannot send recognition to yourself")
  }

  const sender = await User.findOne({ email: senderEmail })

  if (!sender) {
    throw new AppError(httpStatus.NOT_FOUND, "Sender not found")
  }

  const receiver = await User.findOne({ email: receiverEmail })

  if (!receiver) {
    throw new AppError(httpStatus.NOT_FOUND, "Receiver not found")
  }

  if (sender.pointsBalance < points) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Not enough points"
    )
  }

  // deduct sender points
  sender.pointsBalance -= points

  // add receiver points
  receiver.pointsBalance += points

  await sender.save()
  await receiver.save()

  const recognition = await Recognition.create({
    senderEmail,
    receiverEmail,
    category,
    tone,
    value,
    points,
    message,
    status: "SENT"
  })

    await PointsTransaction.create({
    senderEmail,
    receiverEmail,
    points,
    type: "RECOGNITION"
  })

  return recognition
}

const getRecognitionHistory = async (
  email: string,
  query: Record<string, string>
) => {

  const baseQuery = Recognition.find({
    $or: [
      { senderEmail: email },
      { receiverEmail: email }
    ]
  });

  const queryBuilder = new QueryBuilder(baseQuery, query)
    .search(["senderEmail", "receiverEmail", "category", "message"])
    .filter()
    .sort()
    .fields()
    .paginate();

  const result = await queryBuilder.build();
  const meta = await queryBuilder.getMeta();

  return {
    meta,
    result
  };
};

export const RecognitionServices = {
  sendRecognition,
  getRecognitionHistory
}