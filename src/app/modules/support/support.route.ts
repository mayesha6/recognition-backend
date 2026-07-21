import { Router } from "express";
import { SupportControllers } from "./support.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { SupportValidation } from "./support.validation";
import { Role } from "../user/user.interface";

const router = Router();

router.post(
  "/",
  checkAuth(Role.USER, Role.DEPARTMENT_ADMIN, Role.ORGANIZATION_ADMIN, Role.SUPER_ADMIN),
  validateRequest(SupportValidation.createTicketValidation),
  SupportControllers.createTicket
);

router.get(
  "/stats",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN, Role.USER),
  SupportControllers.getTicketStats
);

router.get(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN, Role.USER),
  SupportControllers.getAllTickets
);

// This endpoint matches the "Ticket Response" popup in image_137d22.png
router.patch(
  "/:ticketId/respond",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.DEPARTMENT_ADMIN, Role.USER),
  validateRequest(SupportValidation.respondTicketValidation),
  SupportControllers.respondToTicket
);

router.delete(
  "/:ticketId",
  checkAuth(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN),
  SupportControllers.deleteTicket
);

export const SupportRoutes = router;