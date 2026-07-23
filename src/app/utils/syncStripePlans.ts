import mongoose from "mongoose";
import { Plan } from "../modules/plan/plan.model";
import { stripe } from "../config/stripe";
import { envVars } from "../config/env";

const syncPlans = async () => {
  try {
    console.log("Connecting to Database...");
    await mongoose.connect(envVars.DB_URL);
    console.log("Connected successfully!");

    const plans = await Plan.find({});
    console.log(`Found ${plans.length} plans in the database.`);

    for (const plan of plans) {
      console.log(`\nProcessing plan: "${plan.name}" (ID: ${plan._id})`);
      
      let needsRecreate = false;
      if (!plan.stripePriceId) {
        needsRecreate = true;
      } else {
        try {
          // Check if price exists in active Stripe account
          await stripe.prices.retrieve(plan.stripePriceId);
          console.log(`✅ Price exists in Stripe: ${plan.stripePriceId}`);
        } catch (err: any) {
          console.log(`❌ Price not found in Stripe: ${plan.stripePriceId}. Recreating...`);
          needsRecreate = true;
        }
      }

      if (needsRecreate) {
        try {
          const stripeProduct = await stripe.products.create({
            name: plan.name,
            description: plan.features?.join(", ") || "",
          });

          // Map interval safely
          let stripeInterval: "month" | "year" = "month";
          const intervalStr = String(plan.interval || "").toLowerCase();
          if (intervalStr.includes("year") || intervalStr.includes("annual")) {
            stripeInterval = "year";
          }

          const stripePrice = await stripe.prices.create({
            unit_amount: Math.round(plan.price * 100),
            currency: plan.currency?.toLowerCase() || "usd",
            recurring: {
              interval: stripeInterval,
            },
            product: stripeProduct.id,
          });

          plan.stripeProductId = stripeProduct.id;
          plan.stripePriceId = stripePrice.id;
          await plan.save();
          console.log(`🎉 Successfully recreated! New Price ID: ${stripePrice.id}`);
        } catch (stripeErr: any) {
          console.error(`💥 Failed to create Stripe product/price for ${plan.name}:`, stripeErr.message);
        }
      }
    }

    console.log("\nAll plans processed successfully!");
  } catch (error) {
    console.error("Error syncing plans:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from Database.");
  }
};

syncPlans();
