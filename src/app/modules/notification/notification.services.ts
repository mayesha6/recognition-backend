import { Notification } from "./notification.model";
import { INotification } from "./notification.interface";
import { QueryBuilder } from "../../utils/QueryBuiler";

const createNotification = async (payload: Partial<INotification>) => {
  const result = await Notification.create(payload);
  return result;
};

const getMyNotifications = async (userId: string, query: Record<string, string>) => {
  // Always sort notifications by newest first by default
  const defaultQuery = { sort: "-createdAt", ...query };
  const queryBuilder = new QueryBuilder(
    Notification.find({ recipient: userId }).populate("sender", "name email picture"),
    defaultQuery
  )
    .filter()
    .sort()
    .fields()
    .paginate();

  const data = await queryBuilder.build();
  const meta = await queryBuilder.getMeta();

  return { data, meta };
};

const getUnreadCount = async (userId: string) => {
  const count = await Notification.countDocuments({ recipient: userId, isRead: false });
  return count;
};

const markAsRead = async (userId: string, notificationId: string) => {
  const result = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true }
  );
  return result;
};

const markAllAsRead = async (userId: string) => {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );
  return result;
};

export const NotificationServices = {
  createNotification,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
