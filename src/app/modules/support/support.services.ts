import httpStatus from "http-status-codes";
import { SupportTicket } from "./support.model";
import { User } from "../user/user.model";
import { Notification } from "../notification/notification.model";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuiler";
import { JwtPayload } from "jsonwebtoken";
import { Role } from "../user/user.interface";
import { TicketStatus } from "./support.interface";

const createTicket = async (payload: any, userToken: JwtPayload) => {
  const user = await User.findById(userToken.userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const organizationId = user.organizationId || user._id;

  const ticket = await SupportTicket.create({
    ...payload,
    user: user._id,
    organizationId,
  });

  // Create notifications for Super Admins
  try {
    const superAdmins = await User.find({ role: Role.SUPER_ADMIN });
    for (const admin of superAdmins) {
      await Notification.create({
        recipient: admin._id,
        sender: user._id,
        title: "New Support Ticket",
        message: `Org Admin ${user.name} created ticket: ${ticket.subject}`,
        type: "SUPPORT",
        link: "/super-admin/support-ticket",
      });
    }
  } catch (err) {
    console.error("Failed to create support ticket notifications:", err);
  }

  return ticket;
};

const getTicketStats = async (userToken: JwtPayload) => {
  const filter: any = {};

  if (userToken.role === Role.USER) {
    filter.user = userToken.userId;
  } else if (userToken.role === Role.ORGANIZATION_ADMIN) {
    filter.organizationId = userToken.userId;
  } else if (userToken.role === Role.DEPARTMENT_ADMIN) {
    filter.organizationId = userToken.organizationId;
    // Optional: add department filter if tickets should be strictly department-isolated
  }

  const stats = await SupportTicket.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        open: { $sum: { $cond: [{ $eq: ["$status", TicketStatus.OPEN] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ["$status", TicketStatus.PENDING] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $in: ["$status", [TicketStatus.RESOLVED, TicketStatus.CLOSED]] }, 1, 0] } },
      },
    },
  ]);

  return stats[0] || { open: 0, pending: 0, resolved: 0 };
};

const getAllTickets = async (query: Record<string, string>, userToken: JwtPayload) => {
  const filter: any = {};

  if (userToken.role === Role.USER) {
    filter.user = userToken.userId;
  } else if (userToken.role === Role.ORGANIZATION_ADMIN) {
    filter.organizationId = userToken.userId;
  } else if (userToken.role === Role.DEPARTMENT_ADMIN) {
    filter.organizationId = userToken.organizationId;
  }

  const queryBuilder = new QueryBuilder(
    SupportTicket.find(filter).populate("user", "name email").populate("organizationId", "name"),
    query
  )
    .search(["ticketId", "subject", "category", "description"])
    .filter()
    .sort()
    .paginate();

  const data = await queryBuilder.build();
  const meta = await queryBuilder.getMeta();

  const [openCount, pendingCount, resolvedCount] = await Promise.all([
    SupportTicket.countDocuments({ ...filter, status: TicketStatus.OPEN }),
    SupportTicket.countDocuments({ ...filter, status: TicketStatus.PENDING }),
    SupportTicket.countDocuments({ ...filter, status: { $in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] } }),
  ]);

  return { data, meta: { ...meta, openCount, pendingCount, resolvedCount } };
};

const respondToTicket = async (ticketId: string, payload: any, userToken: JwtPayload) => {
  const ticket = await SupportTicket.findOne({ ticketId });
  if (!ticket) throw new AppError(httpStatus.NOT_FOUND, "Ticket not found");

  // SaaS Isolation Check
  if (userToken.role !== Role.SUPER_ADMIN) {
    const orgId = userToken.role === Role.ORGANIZATION_ADMIN ? userToken.userId : userToken.organizationId;
    if (ticket.organizationId?.toString() !== orgId && ticket.user.toString() !== userToken.userId) {
      throw new AppError(httpStatus.FORBIDDEN, "Not authorized to access this ticket");
    }
  }

  // Update Status & Priority
  if (payload.status) ticket.status = payload.status;
  if (payload.priority) ticket.priority = payload.priority;

  // Add Response Message
  if (payload.message) {
    ticket.responses.push({
      message: payload.message,
      sender: userToken.userId as any,
    });
  }

  await ticket.save();

  // Create notification for ticket response
  try {
    if (userToken.role === Role.SUPER_ADMIN) {
      // Notify the ticket owner
      await Notification.create({
        recipient: ticket.user,
        sender: userToken.userId as any,
        title: "Support Ticket Updated",
        message: `Your ticket ${ticket.ticketId} has received a new response.`,
        type: "SUPPORT",
        link: "/org-admin/support-ticket",
      });
    } else {
      // Notify Super Admins
      const superAdmins = await User.find({ role: Role.SUPER_ADMIN });
      const senderUser = await User.findById(userToken.userId);
      const senderName = senderUser ? senderUser.name : "Org Admin";
      for (const admin of superAdmins) {
        await Notification.create({
          recipient: admin._id,
          sender: userToken.userId as any,
          title: "Support Ticket Response",
          message: `${senderName} replied to ticket ${ticket.ticketId}`,
          type: "SUPPORT",
          link: "/super-admin/support-ticket",
        });
      }
    }
  } catch (err) {
    console.error("Failed to create support response notification:", err);
  }

  return ticket;
};

const deleteTicket = async (ticketId: string, userToken: JwtPayload) => {
  const ticket = await SupportTicket.findOne({ ticketId });
  if (!ticket) throw new AppError(httpStatus.NOT_FOUND, "Ticket not found");

  if (userToken.role !== Role.SUPER_ADMIN) {
    const orgId = userToken.role === Role.ORGANIZATION_ADMIN ? userToken.userId : userToken.organizationId;
    if (ticket.organizationId?.toString() !== orgId && ticket.user.toString() !== userToken.userId) {
      throw new AppError(httpStatus.FORBIDDEN, "Not authorized to delete this ticket");
    }
  }

  await SupportTicket.deleteOne({ ticketId });
  return { message: "Ticket deleted successfully" };
};

export const SupportServices = {
  createTicket,
  getTicketStats,
  getAllTickets,
  respondToTicket,
  deleteTicket,
};