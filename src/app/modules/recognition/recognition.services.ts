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
import { IRecognition, RecognitionStatus } from "./recognition.interface"
import { AiMessengerService } from "../aiMessenger/aiMessenger.service"
import { AiMessage } from "../aiMessenger/aiMessage.model"
import { normalizeRecognitionValues } from "../../utils/normalizeRecognitionValues"


// const sendRecognition = async (
//   senderEmail: string,
//   senderId: string, // pass userId from controller
//   payload: any
// ) => {
//   const {
//     receiverEmail,
//     points,
//     messageId,
//     additionalMessage,
//     image
//   } = payload;

//   const aiMessage = await AiMessage.findById(messageId);

//   if (!aiMessage) {
//     throw new AppError(httpStatus.NOT_FOUND, "AI message not found");
//   }

//   // ownership check
//   if (aiMessage.user.toString() !== senderId) {
//     throw new AppError(httpStatus.FORBIDDEN, "Unauthorized message usage");
//   }

//   if (aiMessage.status === RecognitionStatus.SENT) {
//     throw new AppError(httpStatus.BAD_REQUEST, "Recognition already sent");
//   }

//   if (senderEmail === receiverEmail) {
//     throw new AppError(httpStatus.BAD_REQUEST, "You cannot send recognition to yourself");
//   }

//   const sender = await User.findOne({ email: senderEmail });
//   if (!sender) throw new AppError(httpStatus.NOT_FOUND, "Sender not found");

//   const receiver = await User.findOne({ email: receiverEmail });
//   if (!receiver) throw new AppError(httpStatus.NOT_FOUND, "Receiver not found");

//   const { year, quarter } = getCurrentQuarter();

//   const senderWallet = await Wallet.findOne({ user: sender._id, year, quarter });
//   if (!senderWallet) throw new AppError(httpStatus.NOT_FOUND, "Sender wallet not found");
//   if (senderWallet.pointsBalance < points) throw new AppError(httpStatus.BAD_REQUEST, "Not enough points");

//   const receiverWallet = await Wallet.findOne({ user: receiver._id, year, quarter });
//   if (!receiverWallet) throw new AppError(httpStatus.NOT_FOUND, "Receiver wallet not found");

//   senderWallet.pointsBalance -= points;
//   senderWallet.pointsUsed += points;
//   receiverWallet.pointsBalance += points;

//   await senderWallet.save();
//   await receiverWallet.save();

//   const recognition = await Recognition.create({
//     senderEmail,
//     receiverEmail,
//     department: aiMessage.department,
//     category: aiMessage.category,
//     tone: aiMessage.tone,
//     recognition_values: aiMessage.recognition_values,
//     points,
//     message: aiMessage.generated_message,
//     additionalMessage,
//     image,
//     status: RecognitionStatus.SENT
//   });

//   await PointsTransaction.create({
//     senderEmail,
//     receiverEmail,
//     points,
//     type: "RECOGNITION",
//     status: "COMPLETED"
//   });

//   try {
//     aiMessage.status = RecognitionStatus.SENT;
//     await aiMessage.save();

//     await sendEmail({
//       from: senderEmail,
//       to: receiverEmail,
//       subject: "You received a recognition!",
//       templateName: "recognition",
//       templateData: {
//         senderName: sender.name,
//         receiverName: receiver.name,
//         message: aiMessage.generated_message,
//         additionalMessage: additionalMessage || "",
//         points,
//         image
//       }
//     });

//   } catch {
//     recognition.status = RecognitionStatus.FAILED;
//     await recognition.save();
//   }

//   return recognition;
// };


const sendRecognition = async (
  senderEmail: string,
  senderId: string,
  payload: IRecognition
) => {
  const {
    receiverEmail,
    points,
    messageId,
    additionalMessage,
    image
  } = payload;

  let aiMessage;

  if (messageId) {
    // Use exact AI message if messageId is provided
    aiMessage = await AiMessage.findById(messageId);

    if (!aiMessage) {
      throw new AppError(httpStatus.NOT_FOUND, "AI message not found");
    }
    console.log("AI message found with provided messageId:", aiMessage);
    console.log(
      "Using specified AI message:",
      "aiMessage.user =", aiMessage.user.toString(),
      "senderId =", senderId,
      "messageId =", messageId
    );

    // Prevent using another user's message
    if (aiMessage.user.toString() !== senderId) {
      throw new AppError(httpStatus.FORBIDDEN, "Unauthorized message usage");
    }
  } else {
    // Fallback to latest pending AI message
    aiMessage = await AiMessage.findOne({
      user: senderId,
      status: RecognitionStatus.PENDING
    }).sort({ createdAt: -1 });

    if (!aiMessage) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "No pending AI message found for this user"
      );
    }

    console.log(
      "Using latest pending AI message:",
      "aiMessage.user =", aiMessage.user.toString(),
      "senderId =", senderId,
      "messageId =", aiMessage._id.toString()
    );
  }

  if (aiMessage.status === RecognitionStatus.SENT) {
    throw new AppError(httpStatus.BAD_REQUEST, "Recognition already sent");
  }

  if (senderEmail === receiverEmail) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot send recognition to yourself"
    );
  }

  const sender = await User.findOne({ email: senderEmail });
  if (!sender) {
    throw new AppError(httpStatus.NOT_FOUND, "Sender not found");
  }

  const receiver = await User.findOne({ email: receiverEmail });
  if (!receiver) {
    throw new AppError(httpStatus.NOT_FOUND, "Receiver not found");
  }

  const { year, quarter } = getCurrentQuarter();

  const senderWallet = await Wallet.findOne({ user: sender._id, year, quarter });
  if (!senderWallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Sender wallet not found");
  }

  if (senderWallet.pointsBalance < points) {
    throw new AppError(httpStatus.BAD_REQUEST, "Not enough points");
  }

  const receiverWallet = await Wallet.findOne({ user: receiver._id, year, quarter });
  if (!receiverWallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Receiver wallet not found");
  }

  if (aiMessage.department !== receiver.department) {
  throw new AppError(
    httpStatus.BAD_REQUEST,
    "Receiver department does not match the recognition department"
  );
}

console.log(aiMessage.department, receiver.department)

  senderWallet.pointsBalance -= points;
  senderWallet.pointsUsed += points;
  receiverWallet.pointsBalance += points;

  await senderWallet.save();
  await receiverWallet.save();

  const recognitionValues = normalizeRecognitionValues(
  aiMessage.recognition_values
);

  const recognition = await Recognition.create({
    senderEmail,
    receiverEmail,
    // department: aiMessage.department,
    department: receiver.department,
    category: aiMessage.category,
    tone: aiMessage.tone,
    recognition_values: recognitionValues,
    points,
    message: aiMessage.generated_message,
    additionalMessage,
    image,
    status: RecognitionStatus.SENT
  });

  await PointsTransaction.create({
    senderEmail,
    receiverEmail,
    points,
    type: "RECOGNITION",
    status: "COMPLETED"
  });

  try {
    aiMessage.status = RecognitionStatus.SENT;
    await aiMessage.save();

    await sendEmail({
      from: senderEmail,
      to: receiverEmail,
      subject: "You received a recognition!",
      templateName: "recognition",
      templateData: {
        senderName: sender.name,
        receiverName: receiver.name,
        message: aiMessage.generated_message,
        additionalMessage: additionalMessage || "",
        points,
        image
      }
    });
  } catch {
    recognition.status = RecognitionStatus.FAILED;
    await recognition.save();
  }

  return recognition;
};

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