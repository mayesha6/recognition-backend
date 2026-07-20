// import { Router } from "express";
// import { checkAuth } from "../../middlewares/checkAuth";
// import { SubscriptionController } from "./subscription.controller";
// import { Role } from "../user/user.interface";

// const router = Router();

// /**
//  * 💳 CREATE CHECKOUT SESSION (subscribe)
//  */
// router.post(
//   "/checkout",
//   checkAuth(Role.USER), // ✅ all authenticated users can subscribe
//   SubscriptionController.createCheckoutSession
// );

// /**
//  * ❌ CANCEL SUBSCRIPTION
//  */
// router.post(
//   "/cancel",
//   checkAuth(),
//   SubscriptionController.cancelSubscription
// );

// /**
//  * 💳 BILLING PORTAL (manage subscription)
//  */
// router.post(
//   "/billing-portal",
//   checkAuth(),
//   SubscriptionController.billingPortal
// );

// export const SubscriptionRoutes = router;

import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { SubscriptionController } from "./subscription.controller";

const router = Router();

router.post(
  "/checkout", 
  checkAuth(Role.ORGANIZATION_ADMIN, Role.USER), 
  SubscriptionController.createCheckoutSession
);
router.get(
  "/me",
  checkAuth(Role.ORGANIZATION_ADMIN, Role.USER),
  SubscriptionController.getMySubscription
);

// admin - all subscriptions
router.get(
  "/",
  checkAuth(Role.SUPER_ADMIN),
  SubscriptionController.getAllSubscriptions
);

// single subscription
router.get(
  "/:id",
  checkAuth(Role.SUPER_ADMIN),
  SubscriptionController.getSingleSubscription
);
export const SubscriptionRoutes = router;