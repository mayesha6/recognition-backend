import httpStatus from "http-status-codes"
import { Recognition } from "./recognition.model"
import { User } from "../user/user.model"
import AppError from "../../errorHelpers/AppError"
import { QueryBuilder } from "../../utils/QueryBuiler"
import { PointsTransaction } from "../points/points.model"
import { sendEmail } from "../../utils/sendEmail"
import { getCurrentQuarter } from "../../utils/wallet"
import { Wallet } from "../wallet/wallet.model"
import { Category } from "../category/category.model"


const sendRecognition = async (senderEmail: string, payload: any) => {

  const {
    receiverEmail,
    department,
    category,
    tone,
    value,
    points,
    message,
    image
  } = payload

  const categoryData = await Category.findOne({ name: category })

  if (!categoryData) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found")
  }

  if (!categoryData.images.includes(image)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Selected image is not valid for this category"
    )
  }

  if (senderEmail === receiverEmail) {
    throw new AppError(httpStatus.BAD_REQUEST, "You cannot send recognition to yourself")
  }

  const sender = await User.findOne({ email: senderEmail })
  if (!sender) throw new AppError(httpStatus.NOT_FOUND, "Sender not found")

  const receiver = await User.findOne({ email: receiverEmail })
  if (!receiver) throw new AppError(httpStatus.NOT_FOUND, "Receiver not found")

  const { year, quarter } = getCurrentQuarter()

  const senderWallet = await Wallet.findOne({
    user: sender._id,
    year,
    quarter
  })

  if (!senderWallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Sender wallet not found")
  }

  if (senderWallet.pointsBalance < points) {
    throw new AppError(httpStatus.BAD_REQUEST, "Not enough points")
  }

  const receiverWallet = await Wallet.findOne({
    user: receiver._id,
    year,
    quarter
  })

  if (!receiverWallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Receiver wallet not found")
  }

  // deduct sender points
  senderWallet.pointsBalance -= points
  senderWallet.pointsUsed += points

  // add receiver points
  receiverWallet.pointsBalance += points

  await senderWallet.save()
  await receiverWallet.save()

  const recognition = await Recognition.create({
    senderEmail,
    receiverEmail,
    department,
    category,
    tone,
    value,
    points,
    message,
    image,
    status: "SENT"
  })

  await PointsTransaction.create({
    senderEmail,
    receiverEmail,
    points,
    type: "RECOGNITION",
    status: "COMPLETED"
  })

  try {

    await sendEmail({
      from: senderEmail,
      to: receiverEmail,
      subject: "You received a recognition!",
      templateName: "recognition",
      templateData: {
        senderName: sender.name,
        receiverName: receiver.name,
        message,
        points,
        category,
        tone,
        value
      }
    })

  } catch {

    recognition.status = "FAILED"
    await recognition.save()

  }

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
    .search(["senderEmail", "receiverEmail", "category", "message", "department"])
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