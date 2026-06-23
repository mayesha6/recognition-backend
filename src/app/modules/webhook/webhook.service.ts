import { stripe } from "../../config/stripe";
import { SubscriptionStatus } from "../subscription/subscription.interface";
import { Subscription } from "../subscription/subscription.model";
import { User } from "../user/user.model";
import { WebhookEvent } from "./webhook.model";

export const handleStripeWebhook = async (event: any) => {
  // 🛡️ ১. Idempotency Check (ডুপ্লিকেট ইভেন্ট হ্যান্ডলিং)
  const isEventProcessed = await WebhookEvent.findOne({ eventId: event.id });
  if (isEventProcessed) {
    console.log(`⚠️ Webhook event already processed: ${event.id}`);
    return;
  }

  const stripeObject = event.data.object;

  try {
    // =====================================
    // 🔵 SUBSCRIPTION CREATED
    // =====================================
    if (event.type === "customer.subscription.created") {
      const { userId, planId } = stripeObject.metadata || {};

      if (!userId || !planId) return;

      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: stripeObject.id },
        {
          user: userId,
          plan: planId,
          stripeSubscriptionId: stripeObject.id,
          stripeCustomerId: typeof stripeObject.customer === "string" ? stripeObject.customer : stripeObject.customer.id,
          status: stripeObject.status === "trialing" ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE,
          currentPeriodEnd: stripeObject.current_period_end ? new Date(stripeObject.current_period_end * 1000) : null,
          trialEnd: stripeObject.trial_end ? new Date(stripeObject.trial_end * 1000) : null,
        },
        { upsert: true }
      );

      await User.findByIdAndUpdate(userId, {
        stripeSubscriptionId: stripeObject.id,
        subscriptionStatus: stripeObject.status === "trialing" ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE,
        currentPlan: planId,
      });
    }

    // =====================================
    // 🔄 SUBSCRIPTION UPDATED
    // =====================================
    if (event.type === "customer.subscription.updated") {
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: stripeObject.id },
        {
          status:
            stripeObject.status === "active"
              ? SubscriptionStatus.ACTIVE
              : stripeObject.status === "trialing"
                ? SubscriptionStatus.TRIAL
                : SubscriptionStatus.CANCELLED,
          currentPeriodEnd: stripeObject.items.data[0].current_period_end
            ? new Date(stripeObject.items.data[0].current_period_end * 1000)
            : null,
        }
      );
    }

    // =====================================
    // 💰 INVOICE PAID (RENEWAL)
    // =====================================
    if (event.type === "invoice.paid") {
      if (!stripeObject.subscription) return;

      const sub = await stripe.subscriptions.retrieve(stripeObject.subscription);

      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: sub.id },
        {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: sub.items.data[0].current_period_end
            ? new Date(sub.items.data[0].current_period_end * 1000)
            : null,
        }
      );
    }

    // =====================================
    // ❌ PAYMENT FAILED
    // =====================================
    if (event.type === "invoice.payment_failed") {
      const subscription = await Subscription.findOne({
        stripeCustomerId: stripeObject.customer,
      });

      if (subscription) {
        subscription.status = SubscriptionStatus.PAST_DUE;
        await subscription.save();
      }
    }

    // =====================================
    // ❌ SUBSCRIPTION CANCELLED
    // =====================================
    if (event.type === "customer.subscription.deleted") {
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: stripeObject.id },
        { status: SubscriptionStatus.CANCELLED }
      );

      await User.findOneAndUpdate(
        { stripeSubscriptionId: stripeObject.id },
        {
          subscriptionStatus: SubscriptionStatus.CANCELLED,
          currentPlan: null,
        }
      );
    }

    // =====================================
    // 💥 CHECKOUT SESSION COMPLETED 
    // =====================================
    if (event.type === "checkout.session.completed") {
      if (stripeObject.mode === "subscription") {
        // সাবস্ক্রিপশনের মূল কাজ customer.subscription.created তেই হয়ে গেছে।
        await WebhookEvent.create({ eventId: event.id });
        return;
      }
    }

    // 💾 ইভেন্টটি সফলভাবে প্রসেস হলে ডাটাবেজে সেভ করুন যাতে ডুপ্লিকেট না হয়
    await WebhookEvent.create({ eventId: event.id });

  } catch (error) {
    console.error("🔥 Webhook Error:", error);
  }
};