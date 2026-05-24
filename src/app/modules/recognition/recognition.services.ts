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
//   senderId: string,
//   payload: IRecognition
// ) => {
//   const {
//     receiverEmail,
//     points,
//     messageId,
//     additionalMessage,
//     image
//   } = payload;

//   let aiMessage;

//   // =========================
//   // FIND AI MESSAGE
//   // =========================
//   if (messageId) {
//     aiMessage = await AiMessage.findById(messageId);

//     if (!aiMessage) {
//       throw new AppError(httpStatus.NOT_FOUND, "AI message not found");
//     }

//     // Prevent using another user's message
//     if (aiMessage.user.toString() !== senderId.toString()) {
//       throw new AppError(
//         httpStatus.FORBIDDEN,
//         "Unauthorized message usage"
//       );
//     }
//   } else {
//     aiMessage = await AiMessage.findOne({
//       user: senderId,
//       status: RecognitionStatus.PENDING
//     }).sort({ createdAt: -1 });

//     if (!aiMessage) {
//       throw new AppError(
//         httpStatus.NOT_FOUND,
//         "No pending AI message found for this user"
//       );
//     }
//   }

//   // =========================
//   // ALREADY SENT CHECK
//   // =========================
//   if (aiMessage.status === RecognitionStatus.SENT) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "Recognition already sent"
//     );
//   }

//   // =========================
//   // SELF SEND CHECK
//   // =========================
//   if (senderEmail === receiverEmail) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "You cannot send recognition to yourself"
//     );
//   }

//   // =========================
//   // FIND SENDER
//   // =========================
//   const sender = await User.findOne({ email: senderEmail });

//   if (!sender) {
//     throw new AppError(
//       httpStatus.NOT_FOUND,
//       "Sender not found"
//     );
//   }

//   // =========================
//   // FIND RECEIVER (OPTIONAL)
//   // =========================
//   const receiver = await User.findOne({
//     email: receiverEmail
//   });

//   // Default values for non-registered user
//   let receiverDepartment = "Non Registered";
//   let receiverWallet = null;

//   // =========================
//   // QUARTER
//   // =========================
//   const { year, quarter } = getCurrentQuarter();

//   // =========================
//   // SENDER WALLET
//   // =========================
//   const senderWallet = await Wallet.findOne({
//     user: sender._id,
//     year,
//     quarter
//   });

//   if (!senderWallet) {
//     throw new AppError(
//       httpStatus.NOT_FOUND,
//       "Sender wallet not found"
//     );
//   }

//   // =========================
//   // POINT BALANCE CHECK
//   // =========================
//   if (senderWallet.pointsBalance < points) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "Not enough points"
//     );
//   }

//   // =========================
//   // REGISTERED USER LOGIC
//   // =========================
//   if (receiver) {
//     receiverDepartment = receiver.department;

//     // Department validation
//     if (aiMessage.department !== receiver.department) {
//       throw new AppError(
//         httpStatus.BAD_REQUEST,
//         "Receiver department does not match the recognition department"
//       );
//     }

//     receiverWallet = await Wallet.findOne({
//       user: receiver._id,
//       year,
//       quarter
//     });

//     if (!receiverWallet) {
//       throw new AppError(
//         httpStatus.NOT_FOUND,
//         "Receiver wallet not found"
//       );
//     }
//   }

//   // =========================
//   // UPDATE WALLET
//   // =========================
//   senderWallet.pointsBalance -= points;
//   senderWallet.pointsUsed += points;

//   // Only if registered user
//   if (receiverWallet) {
//     receiverWallet.pointsBalance += points;
//   }

//   await senderWallet.save();

//   if (receiverWallet) {
//     await receiverWallet.save();
//   }

//   // =========================
//   // NORMALIZE VALUES
//   // =========================
//   const recognitionValues = normalizeRecognitionValues(
//     aiMessage.recognition_values
//   );

//   // =========================
//   // CREATE RECOGNITION
//   // =========================
//   const recognition = await Recognition.create({
//     senderEmail,
//     receiverEmail,

//     // Non-registered হলে এইটা হবে
//     department: receiverDepartment,

//     category: aiMessage.category,
//     tone: aiMessage.tone,
//     recognition_values: recognitionValues,
//     points,
//     message: aiMessage.generated_message,
//     additionalMessage,
//     image,
//     status: RecognitionStatus.SENT
//   });

//   // =========================
//   // TRANSACTION
//   // =========================
//   await PointsTransaction.create({
//     senderEmail,
//     receiverEmail,
//     points,
//     type: "RECOGNITION",
//     status: "COMPLETED"
//   });

//   // =========================
//   // EMAIL + AI STATUS
//   // =========================
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

//         // Non-registered user support
//         receiverName: receiver?.name || "User",

//         message: aiMessage.generated_message,
//         additionalMessage: additionalMessage || "",
//         points,
//         image
//       }
//     });
//   } catch (error) {
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
    image,
    message: customMessage // Extract custom message from payload
  } = payload;

  let aiMessage;

  // =========================
  // FIND AI MESSAGE
  // =========================
  if (messageId) {
    aiMessage = await AiMessage.findById(messageId);

    if (!aiMessage) {
      throw new AppError(httpStatus.NOT_FOUND, "AI message not found");
    }

    // Prevent using another user's message
    if (aiMessage.user.toString() !== senderId.toString()) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Unauthorized message usage"
      );
    }
  } else {
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
  }

  // =========================
  // DETERMINE THE FINAL MESSAGE
  // =========================
  // Prioritize the custom message from the payload if it exists
  const finalMessage = customMessage && customMessage.trim() !== "" 
    ? customMessage 
    : aiMessage.generated_message;

  // =========================
  // ALREADY SENT CHECK
  // =========================
  if (aiMessage.status === RecognitionStatus.SENT) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Recognition already sent"
    );
  }

  // =========================
  // SELF SEND CHECK
  // =========================
  if (senderEmail === receiverEmail) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot send recognition to yourself"
    );
  }

  // =========================
  // FIND SENDER
  // =========================
  const sender = await User.findOne({ email: senderEmail });

  if (!sender) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Sender not found"
    );
  }

  // =========================
  // FIND RECEIVER (OPTIONAL)
  // =========================
  const receiver = await User.findOne({
    email: receiverEmail
  });

  // Default values for non-registered user
  let receiverDepartment = "Non Registered";
  let receiverWallet = null;

  // =========================
  // QUARTER
  // =========================
  const { year, quarter } = getCurrentQuarter();

  // =========================
  // SENDER WALLET
  // =========================
  const senderWallet = await Wallet.findOne({
    user: sender._id,
    year,
    quarter
  });

  if (!senderWallet) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Sender wallet not found"
    );
  }

  // =========================
  // POINT BALANCE CHECK
  // =========================
  if (senderWallet.pointsBalance < points) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Not enough points"
    );
  }

  // =========================
  // REGISTERED USER LOGIC
  // =========================
  if (receiver) {
    receiverDepartment = receiver.department;

    // Department validation
    if (aiMessage.department !== receiver.department) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Receiver department does not match the recognition department"
      );
    }

    receiverWallet = await Wallet.findOne({
      user: receiver._id,
      year,
      quarter
    });

    if (!receiverWallet) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Receiver wallet not found"
      );
    }
  }

  // =========================
  // UPDATE WALLET
  // =========================
  senderWallet.pointsBalance -= points;
  senderWallet.pointsUsed += points;

  // Only if registered user
  if (receiverWallet) {
    receiverWallet.pointsBalance += points;
  }

  await senderWallet.save();

  if (receiverWallet) {
    await receiverWallet.save();
  }

  // =========================
  // NORMALIZE VALUES
  // =========================
  const recognitionValues = normalizeRecognitionValues(
    aiMessage.recognition_values
  );

  // =========================
  // CREATE RECOGNITION
  // =========================
  const recognition = await Recognition.create({
    senderEmail,
    receiverEmail,
    department: receiverDepartment,
    category: aiMessage.category,
    tone: aiMessage.tone,
    recognition_values: recognitionValues,
    points,
    message: finalMessage, // Use the determined final message
    additionalMessage,
    image,
    status: RecognitionStatus.SENT
  });

  // =========================
  // TRANSACTION
  // =========================
  await PointsTransaction.create({
    senderEmail,
    receiverEmail,
    points,
    type: "RECOGNITION",
    status: "COMPLETED"
  });

  // =========================
  // EMAIL + AI STATUS
  // =========================
  try {
    aiMessage.status = RecognitionStatus.SENT;
    aiMessage.generated_message = finalMessage; // Save the updated message to DB

    await aiMessage.save();

    await sendEmail({
      from: senderEmail,
      to: receiverEmail,
      subject: "You received a recognition!",
      templateName: "recognition",
      templateData: {
        senderName: sender.name,
        receiverName: receiver?.name || "User",
        message: finalMessage, // Use the determined final message
        additionalMessage: additionalMessage || "",
        points,
        image
      }
    });
  } catch (error) {
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