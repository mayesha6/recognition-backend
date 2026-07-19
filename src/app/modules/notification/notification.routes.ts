import { Router } from "express";
import { NotificationControllers } from "./notification.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = Router();

router.get(
  "/",
  checkAuth(...Object.values(Role)),
  NotificationControllers.getMyNotifications
);

router.get(
  "/unread-count",
  checkAuth(...Object.values(Role)),
  NotificationControllers.getUnreadCount
);

router.patch(
  "/mark-all-read",
  checkAuth(...Object.values(Role)),
  NotificationControllers.markAllAsRead
);

router.patch(
  "/:id/read",
  checkAuth(...Object.values(Role)),
  NotificationControllers.markAsRead
);

export const NotificationRoutes = router;
