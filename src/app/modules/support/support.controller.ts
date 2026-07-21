import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { SupportServices } from "./support.services";

const createTicket = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await SupportServices.createTicket(req.body, decodedToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Support ticket created successfully",
    data: result,
  });
});

const getTicketStats = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await SupportServices.getTicketStats(decodedToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Ticket stats retrieved successfully",
    data: result,
  });
});

const getAllTickets = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const { data, meta } = await SupportServices.getAllTickets(req.query as Record<string, string>, decodedToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tickets retrieved successfully",
    meta,
    data,
  });
});

const respondToTicket = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const { ticketId } = req.params;

  const result = await SupportServices.respondToTicket(ticketId, req.body, decodedToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Ticket updated successfully",
    data: result,
  });
});

const deleteTicket = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const { ticketId } = req.params;

  const result = await SupportServices.deleteTicket(ticketId, decodedToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Ticket deleted successfully",
    data: result,
  });
});

export const SupportControllers = {
  createTicket,
  getTicketStats,
  getAllTickets,
  respondToTicket,
  deleteTicket,
};