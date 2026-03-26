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

const CACHE_TTL = 600; // 10 minutes

const regenerateMessage = async (
    userId: string,
    payload: IRegenerateInput
): Promise<IRegenerateResponse> => {
    const cacheKey = `ai_cache:${hashPayload(payload)}`; // fixed line

    const cached = await redisClient.get(cacheKey);
    if (cached) {
        return JSON.parse(cached.toString());
    }

    let data: IRegenerateResponse;

    try {
        const response = await aiAxios.post<IRegenerateResponse>(
            "/api/messenger/regenerate",
            payload
        );
        data = response.data;
    } catch (error: any) {
        throw new AppError(
            httpStatus.BAD_GATEWAY,
            error?.response?.data?.detail || "AI service failed"
        );
    }

    await redisClient.set(cacheKey, JSON.stringify(data), {"EX": CACHE_TTL});

    await AiMessage.create({
        user: userId,
        ...payload,
        generated_message: data.message
    });

    return data;
};

export const AiMessengerService = {
    regenerateMessage
};