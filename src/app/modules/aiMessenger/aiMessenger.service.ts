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

const CACHE_TTL = 600; // 10 minutes

// const generateMessage = async (
//     userId: string,
//     payload: IRegenerateInput
// ): Promise<IRegenerateResponse> => {
//     const cacheKey = `ai_generate:${hashPayload(payload)}`;

//     const cached = await redisClient.get(cacheKey);
//     if (cached) {
//         return JSON.parse(cached.toString());
//     }

//     let data: IRegenerateResponse;

//     try {
//         const response = await aiAxios.post<IRegenerateResponse>(
//             "/api/messenger/generate",
//             payload
//         );
//         data = response.data;
//     } catch (error: any) {
//     const errMessage =
//         error?.response?.data?.detail
//             ? typeof error.response.data.detail === "string"
//                 ? error.response.data.detail
//                 : JSON.stringify(error.response.data.detail)
//             : error.message || "AI service failed";

//     throw new AppError(httpStatus.BAD_GATEWAY, errMessage);
// }

//     await redisClient.set(cacheKey, JSON.stringify(data), { EX: CACHE_TTL });

//     await AiMessage.create({
//         user: userId,
//         ...payload,
//         generated_message: data.message
//     });

//     return data;
// };

// const regenerateMessage = async (
//     userId: string,
//     payload: IRegenerateInput
// ): Promise<IRegenerateResponse> => {
//     const cacheKey = `ai_cache:${hashPayload(payload)}`; // fixed line

//     const cached = await redisClient.get(cacheKey);
//     if (cached) {
//         return JSON.parse(cached.toString());
//     }

//     let data: IRegenerateResponse;

//     try {
//         const response = await aiAxios.post<IRegenerateResponse>(
//             "/api/messenger/regenerate",
//             payload
//         );
//         data = response.data;
//     } catch (error: any) {
//     const errMessage =
//         error?.response?.data?.detail
//             ? typeof error.response.data.detail === "string"
//                 ? error.response.data.detail
//                 : JSON.stringify(error.response.data.detail)
//             : error.message || "AI service failed";

//     throw new AppError(httpStatus.BAD_GATEWAY, errMessage);
// }

//     await redisClient.set(cacheKey, JSON.stringify(data), {"EX": CACHE_TTL});

//     await AiMessage.create({
//         user: userId,
//         ...payload,
//         generated_message: data.message
//     });

//     return data;
// };

// const editMessage = async (userId: string, newMessage: string) => {
//     const aiMessage = await AiMessage.findOne({ user: userId }).sort({ createdAt: -1 });

//     if (!aiMessage) {
//         throw new AppError(httpStatus.NOT_FOUND, "No message found to edit");
//     }

//     aiMessage.generated_message = newMessage;
//     await aiMessage.save();

//     return aiMessage;
// };







const generateMessage = async (
    userId: string,
    payload: IRegenerateInput
): Promise<IRegenerateResponse & { messageId: string }> => {
    const cacheKey = `ai_generate:${hashPayload(payload)}`;

   

    let data: IRegenerateResponse;

    try {
        const response = await aiAxios.post<IRegenerateResponse>(
            "/api/messenger/generate",
            payload
        );
        data = response.data;
    } catch (error: any) {
        const errMessage =
            error?.response?.data?.detail
                ? typeof error.response.data.detail === "string"
                    ? error.response.data.detail
                    : JSON.stringify(error.response.data.detail)
                : error.message || "AI service failed";

        throw new AppError(httpStatus.BAD_GATEWAY, errMessage);
    }

    const savedMessage = await AiMessage.create({
        user: new Types.ObjectId(userId),
        ...payload,
        generated_message: data.message,
        status: RecognitionStatus.PENDING
    });

    const result = {
        ...data,
        messageId: savedMessage._id.toString()
    };

   
    return result;
};

const regenerateMessage = async (
    userId: string,
    payload: IRegenerateInput
): Promise<IRegenerateResponse & { messageId: string }> => {
    const cacheKey = `ai_cache:${hashPayload(payload)}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
        const parsed = JSON.parse(cached.toString());
        return parsed;
    }

    let data: IRegenerateResponse;

    try {
        const response = await aiAxios.post<IRegenerateResponse>(
            "/api/messenger/regenerate",
            payload
        );
        data = response.data;
    } catch (error: any) {
        const errMessage =
            error?.response?.data?.detail
                ? typeof error.response.data.detail === "string"
                    ? error.response.data.detail
                    : JSON.stringify(error.response.data.detail)
                : error.message || "AI service failed";

        throw new AppError(httpStatus.BAD_GATEWAY, errMessage);
    }

    const savedMessage = await AiMessage.create({
        user: new Types.ObjectId(userId),
        ...payload,
        generated_message: data.message,
        status: RecognitionStatus.PENDING
    });

    const result = {
        ...data,
        messageId: savedMessage._id.toString()
    };

    await redisClient.set(cacheKey, JSON.stringify(result), { EX: CACHE_TTL });

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
  userId: string,
  messageId: string,
  newMessage: string
) => {
  const aiMessage = await AiMessage.findById(messageId);

  if (!aiMessage) {
    throw new AppError(httpStatus.NOT_FOUND, "No message found to edit");
  }

  if (aiMessage.user.toString() !== userId) {
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