// recognition.services.ts
import mongoose from "mongoose";
import httpStatus from "http-status-codes";
import { Recognition } from "./recognition.model";
import { User } from "../user/user.model";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuiler";
import { PointsTransaction } from "../points/points.model";
import { sendEmail } from "../../utils/sendEmail";
import { getCurrentQuarter } from "../../utils/wallet";
import { Wallet } from "../wallet/wallet.model";
import { IRecognition, RecognitionStatus } from "./recognition.interface";
import { AiMessage } from "../aiMessenger/aiMessage.model";
import { normalizeRecognitionValues } from "../../utils/normalizeRecognitionValues";
import { JwtPayload } from "jsonwebtoken";
import { Role } from "../user/user.interface";

const sendRecognition = async (
  senderToken: JwtPayload,
  payload: IRecognition
) => {
  const {
    receiverEmail,
    points,
    messageId,
    additionalMessage,
    image,
    recipient_name
  } = payload;

  const senderEmail = senderToken.email;
  const senderId = senderToken.userId;

  if (senderEmail === receiverEmail) {
    throw new AppError(httpStatus.BAD_REQUEST, "You cannot send recognition to yourself");
  }

  const incomingText = (payload as any).message || (payload as any).newMessage || (payload as any).generated_message;
  let aiMessage;

  // =========================
  // AI MESSAGE VALIDATION
  // =========================
  if (messageId) {
    aiMessage = await AiMessage.findById(messageId);
    if (!aiMessage || aiMessage.user.toString() !== senderId.toString()) {
      throw new AppError(httpStatus.FORBIDDEN, "AI message not found or unauthorized usage");
    }
  } else {
    aiMessage = await AiMessage.findOne({
      user: senderId,
      status: RecognitionStatus.PENDING
    }).sort({ createdAt: -1 });

    if (!aiMessage) {
      throw new AppError(httpStatus.NOT_FOUND, "No pending AI message found for this user");
    }
  }

  if (aiMessage.status === RecognitionStatus.SENT) {
    throw new AppError(httpStatus.BAD_REQUEST, "Recognition already sent");
  }

  const finalMessage = incomingText && incomingText.trim() !== "" ? incomingText : aiMessage.generated_message;

  // =========================
  // START SECURE TRANSACTION
  // =========================
  const session = await mongoose.startSession();
  let createdRecognition: any;

  try {
    session.startTransaction();

    const sender = await User.findOne({ email: senderEmail }).session(session);
    if (!sender) throw new AppError(httpStatus.NOT_FOUND, "Sender not found");

    const receiver = await User.findOne({ email: receiverEmail }).session(session);
    
    // 🔥 SaaS Isolation: Prevent Cross-Tenant Sending
    if (receiver && senderToken.role !== Role.SUPER_ADMIN) {
      const senderOrgId = sender.organizationId?.toString() || sender._id.toString();
      const receiverOrgId = receiver.organizationId?.toString() || receiver._id.toString();

      if (senderOrgId !== receiverOrgId) {
        throw new AppError(httpStatus.FORBIDDEN, "You can only send recognition within your organization");
      }
    }

    const { year, quarter } = getCurrentQuarter();

    // =========================
    // POINT DEDUCTION LOGIC
    // =========================
    // Super Admins have infinite points, so bypass deduction
    if (senderToken.role !== Role.SUPER_ADMIN) {
      const senderWallet = await Wallet.findOne({ user: sender._id, year, quarter }).session(session);
      
      if (!senderWallet || senderWallet.pointsBalance < points) {
        throw new AppError(httpStatus.BAD_REQUEST, "Not enough points in your wallet");
      }

      await Wallet.updateOne(
        { _id: senderWallet._id },
        { $inc: { pointsBalance: -points, pointsUsed: points } },
        { session }
      );
    }

    // =========================
    // RECEIVER WALLET ADDITION
    // =========================
    let receiverDepartment = "Non Registered";

    if (receiver) {
      receiverDepartment = receiver.department;
      
      if (aiMessage.department && aiMessage.department !== receiver.department) {
        throw new AppError(httpStatus.BAD_REQUEST, "Receiver department does not match the AI recognition intent");
      }

      await Wallet.updateOne(
        { user: receiver._id, year, quarter },
        { $inc: { pointsBalance: points, pointsAllocated: points } },
        { upsert: true, session }
      );
    }

    // =========================
    // CREATE RECORDS
    // =========================
    const recognitionValues = normalizeRecognitionValues(aiMessage.recognition_values);
    const orgId = senderToken.role === Role.SUPER_ADMIN ? null : (sender.organizationId || sender._id);

    const recognitionDoc = await Recognition.create(
      [{
        senderEmail,
        receiverEmail,
        department: receiverDepartment,
        category: aiMessage.category,
        tone: aiMessage.tone,
        recognition_values: recognitionValues,
        points,
        message: finalMessage,
        additionalMessage,
        image,
        status: RecognitionStatus.SENT,
        organizationId: orgId
      }],
      { session }
    );
    createdRecognition = recognitionDoc[0];

    await PointsTransaction.create(
      [{
        senderEmail,
        receiverEmail,
        points,
        type: "RECOGNITION",
        status: "COMPLETED"
      }],
      { session }
    );

    // Commit if all DB operations succeed
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  // =========================
  // POST-TRANSACTION LOGIC (Emails & AI Status Update)
  // =========================
  try {
    aiMessage.status = RecognitionStatus.SENT;
    aiMessage.generated_message = finalMessage;
    await aiMessage.save();

    await sendEmail({
      from: senderEmail,
      to: receiverEmail,
      subject: "You received a recognition!",
      templateName: "recognition",
      templateData: {
        senderName: senderToken.name || "A Colleague",
        receiverName: recipient_name || "User",
        message: finalMessage,
        additionalMessage: additionalMessage || "",
        points,
        image
      }
    });
  } catch (error) {
    // If email fails, mark as failed but don't rollback the points (business logic choice)
    await Recognition.findByIdAndUpdate(createdRecognition._id, { status: RecognitionStatus.FAILED });
  }

  return createdRecognition;
};

const getRecognitionHistory = async (
  userToken: JwtPayload,
  query: Record<string, string>
) => {
  const filter: any = {};

  // SaaS Isolation for History Fetching
  if (userToken.role === Role.USER) {
    // Regular users only see their own history
    filter.organizationId = userToken.organizationId;
    filter.$or = [{ senderEmail: userToken.email }, { receiverEmail: userToken.email }];
  } else if (userToken.role === Role.ORGANIZATION_ADMIN || userToken.role === Role.DEPARTMENT_ADMIN) {
    // Admins can see the whole organization's history
    filter.organizationId = userToken.role === Role.ORGANIZATION_ADMIN ? userToken.userId : userToken.organizationId;
  }

  const queryBuilder = new QueryBuilder(Recognition.find(filter), query)
    .search(["senderEmail", "receiverEmail", "category", "message", "department"])
    .filter()
    .sort()
    .fields()
    .paginate();

  const result = await queryBuilder.build();
  const meta = await queryBuilder.getMeta();

  return { meta, result };
};

const deleteRecognition = async (id: string, userToken: JwtPayload) => {
  const recognition = await Recognition.findById(id);
  if (!recognition) {
    throw new AppError(httpStatus.NOT_FOUND, "Recognition not found");
  }

  // SaaS Isolation: User can delete if they are either sender or receiver
  if (userToken.role === Role.USER) {
    if (recognition.receiverEmail !== userToken.email && recognition.senderEmail !== userToken.email) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to delete this recognition");
    }
  } else if (userToken.role !== Role.SUPER_ADMIN) {
    // Org Admin / Dept Admin must belong to the same organization
    const orgId = userToken.role === Role.ORGANIZATION_ADMIN ? userToken.userId : userToken.organizationId;
    if (recognition.organizationId?.toString() !== orgId?.toString()) {
      throw new AppError(httpStatus.FORBIDDEN, "You can only delete recognitions within your organization");
    }
  }

  const result = await Recognition.findByIdAndDelete(id);
  return result;
};

export const RecognitionServices = {
  sendRecognition,
  getRecognitionHistory,
  deleteRecognition
};