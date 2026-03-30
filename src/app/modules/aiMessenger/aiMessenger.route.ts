import express from "express";
import { editMessageSchema, regenerateSchema } from "./aiMessenger.validation";
import { AiMessengerController } from "./aiMessenger.controller";
import { aiRateLimiter } from "../../middlewares/aiRateLimiter";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";

const router = express.Router();

router.post(
    "/generate",
    checkAuth("USER", "ADMIN", "SUPER_ADMIN"),
    aiRateLimiter,
    validateRequest(regenerateSchema),
    AiMessengerController.generate
);
router.post(
    "/regenerate",
    checkAuth("USER", "ADMIN", "SUPER_ADMIN"),
    aiRateLimiter,
    validateRequest(regenerateSchema),
    AiMessengerController.regenerate
);

router.patch(
    "/edit",
    checkAuth("USER", "ADMIN", "SUPER_ADMIN"),
    validateRequest(editMessageSchema),
    AiMessengerController.editMessage
);

export const AiMessengerRoutes = router;