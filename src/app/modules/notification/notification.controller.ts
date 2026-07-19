import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { NotificationServices } from "./notification.services";
import { JwtPayload } from "jsonwebtoken";

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { data, meta } = await NotificationServices.getMyNotifications(
    user.userId,
    req.query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Notifications retrieved successfully",
    meta,
    data,
  });
});

const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const count = await NotificationServices.getUnreadCount(user.userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Unread count retrieved successfully",
    data: { count },
  });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { id } = req.params;
  const result = await NotificationServices.markAsRead(user.userId, id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Notification marked as read successfully",
    data: result,
  });
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await NotificationServices.markAllAsRead(user.userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All notifications marked as read successfully",
    data: result,
  });
});

export const NotificationControllers = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
