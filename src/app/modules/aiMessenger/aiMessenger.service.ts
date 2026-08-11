import httpStatus from "http-status-codes";
import { aiAxios } from "../../config/aiAxios";
import { hashPayload } from "../../utils/hashPayload";
import { AiMessage } from "./aiMessage.model";
import {
    IRegenerateInput,
    IRegenerateResponse
} from "./aiMessenger.interface";
import AppError from "../../errorHelpers/AppError";
import { redisClient } from "../../config/redis.config";
import { RecognitionStatus } from "../recognition/recognition.interface";
import { Types } from "mongoose";
import { RecognitionValue } from "../recognitionValue/recognitionValue.model";

const CACHE_TTL = 600; // 10 minutes

const handleAiError = (error: any) => {
    let errMessage =
        error?.response?.data?.detail
            ? typeof error.response.data.detail === "string"
                ? error.response.data.detail
                : JSON.stringify(error.response.data.detail)
            : error.message || "AI service failed";

    if (errMessage.includes("Incorrect API key") || errMessage.includes("invalid_api_key") || errMessage.includes("401")) {
        errMessage = "AI service is temporarily unavailable due to an invalid API key configuration. Please contact support.";
    } else if (errMessage.includes("quota") || errMessage.includes("billing") || errMessage.includes("insufficient_quota")) {
        errMessage = "AI service is temporarily unavailable due to insufficient balance/quota. Please check billing status.";
    } else if (errMessage.includes("Rate limit") || errMessage.includes("rate_limit") || errMessage.includes("429")) {
        errMessage = "AI service limit reached. Please try again after some time.";
    }

    return new AppError(httpStatus.BAD_GATEWAY, errMessage);
};

interface IAiServiceInput {
    category: string;
    department: string;
    recipient_name: string;
    recognition_values: Array<{ value: string; description: string }>;
    tone: string;
    userPrompt?: string;
}

const enrichPayload = async (payload: IRegenerateInput): Promise<IAiServiceInput> => {
    const defaultVal: IAiServiceInput = {
        ...payload,
        recognition_values: (payload.recognition_values || []).map(val => ({ value: val, description: "" }))
    };

    if (!payload.recognition_values || payload.recognition_values.length === 0) {
        return defaultVal;
    }

    try {
        const recValues = await RecognitionValue.find({
            name: { $in: payload.recognition_values }
        });

        const enrichedValues = payload.recognition_values.map((val: string) => {
            const match = recValues.find(rv => rv.name === val);
            return {
                value: val,
                description: match?.description || ""
            };
        });

        return {
            ...payload,
            recognition_values: enrichedValues
        };
    } catch (error) {
        console.error("Failed to enrich payload with recognition value descriptions:", error);
    }

    return defaultVal;
};

const generateMessage = async (
    userId: string,
    payload: IRegenerateInput
): Promise<IRegenerateResponse & { messageId: string }> => {
    // const cacheKey = `ai_generate:${hashPayload(payload)}`;

    const enrichedPayload = await enrichPayload(payload);

    let data: IRegenerateResponse;

    try {
        const response = await aiAxios.post<IRegenerateResponse>(
            "/api/messenger/generate",
            enrichedPayload
        );
        data = response.data;
    } catch (error: any) {
        throw handleAiError(error);
    }

    const savedMessage = await AiMessage.create({
        user: new Types.ObjectId(userId),
        ...payload,
        generated_message: data.message,
        status: RecognitionStatus.PENDING
    });

    const result = {
        ...data,
        messageId: savedMessage ? savedMessage._id.toString() : ""
    };

   
    return result;
};

const regenerateMessage = async (
    userId: string,
    payload: IRegenerateInput
): Promise<IRegenerateResponse & { messageId: string }> => {
    // const cacheKey = `ai_cache:${hashPayload(payload)}`;

    // const cached = await redisClient.get(cacheKey);
    // if (cached) {
    //     const parsed = JSON.parse(cached.toString());
    //     return parsed;
    // }

    const enrichedPayload = await enrichPayload(payload);

    let data: IRegenerateResponse;

    try {
        const response = await aiAxios.post<IRegenerateResponse>(
            "/api/messenger/regenerate",
            enrichedPayload
        );
        data = response.data;
    } catch (error: any) {
        throw handleAiError(error);
    }

    const savedMessage = await AiMessage.create({
        user: new Types.ObjectId(userId),
        ...payload,
        generated_message: data.message,
        status: RecognitionStatus.PENDING
    });

    const result = {
        ...data,
        messageId: savedMessage ? savedMessage._id.toString() : ""
    };

    // await redisClient.set(cacheKey, JSON.stringify(result), { EX: CACHE_TTL });

    return result;
};

// const editMessage = async (userId: string, newMessage: string) => {
//     const aiMessage = await AiMessage.findOne({ user: userId }).sort({ createdAt: -1 });

//     if (!aiMessage) {
//         throw new AppError(httpStatus.NOT_FOUND, "No message found to edit");
//     }

//     aiMessage.generated_message = newMessage;
//     aiMessage.status = RecognitionStatus.PENDING;
//     await aiMessage.save();

//     return {
//         messageId: aiMessage._id.toString(),
//         message: aiMessage.generated_message
//     };
// };


const editMessage = async (
  userId: string | Types.ObjectId, // Accept both string and ObjectId
  messageId: string,
  newMessage: string
) => {
  const aiMessage = await AiMessage.findById(messageId);

  if (!aiMessage) {
    throw new AppError(httpStatus.NOT_FOUND, "No message found to edit");
  }

  // Convert both to strings for a safe, strict comparison
  if (aiMessage.user.toString() !== userId.toString()) {
    throw new AppError(httpStatus.FORBIDDEN, "Unauthorized message edit");
  }

  aiMessage.generated_message = newMessage;
  aiMessage.status = RecognitionStatus.PENDING;
  await aiMessage.save();

  return {
    messageId: aiMessage._id.toString(),
    message: aiMessage.generated_message
  };
};
export const AiMessengerService = {
    generateMessage,
    regenerateMessage,
    editMessage
};