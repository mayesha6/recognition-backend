import { Request, Response } from "express";
import { stripe } from "../../config/stripe";
import { handleStripeWebhook } from "./webhook.service";

export const stripeWebhook = async (
  req: Request,
  res: Response
) => {
  const sig = req.headers["stripe-signature"] as string;

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  await handleStripeWebhook(event);

  res.status(200).json({ received: true });
};

export const WebhookController = {
  stripeWebhook,
};