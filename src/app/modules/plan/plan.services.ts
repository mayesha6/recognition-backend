import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { Plan } from "./plan.model";
import { stripe } from "../../config/stripe";

const mapIntervalToStripe = (
  interval: string
): "day" | "week" | "month" | "year" => {
  switch (interval) {
    case "DAY":
      return "day";
    case "WEEK":
      return "week";
    case "MONTH":
      return "month";
    case "YEAR":
      return "year";
    default:
      return "month";
  }
};

const createPlan = async (payload: any) => {
  const existingPlan = await Plan.findOne({ name: payload.name });

  if (existingPlan) {
    throw new AppError(httpStatus.BAD_REQUEST, "Plan already exists");
  }

  if (payload.price === 0) {
    return Plan.create({
      ...payload,
      currency: "USD",
      features: payload.features || [],
      stripeProductId: null,
      stripePriceId: null,
       access: {
      products: payload.access?.products || [],
      courses: payload.access?.courses || [],
      bundles: payload.access?.bundles || [],
    },
    });
  }

  const stripeProduct = await stripe.products.create({
    name: payload.name,
    description: payload.features?.join(", "),
  });

  const stripePrice = await stripe.prices.create({
    unit_amount: Math.round(payload.price * 100),
    currency: payload.currency?.toLowerCase() || "usd",
    recurring: {
      interval: mapIntervalToStripe(payload.interval),
    },
    product: stripeProduct.id,
  });

  return Plan.create({
    ...payload,
    currency: payload.currency || "USD",
    features: payload.features || [],
    stripeProductId: stripeProduct.id,
    stripePriceId: stripePrice.id,
    access: payload.access || {
      products: [],
      courses: [],
      bundles: [],
    },
  });
};

const getAllPlans = async () => {
  return Plan.find({ isActive: true }).sort({ createdAt: -1 });
};

const getPlanById = async (id: string) => {
  const plan = await Plan.findById(id);

  if (!plan) {
    throw new AppError(httpStatus.NOT_FOUND, "Plan not found");
  }

  return plan;
};

// const updatePlan = async (id: string, payload: any) => {
//   const plan = await Plan.findById(id);

//   if (!plan) {
//     throw new AppError(httpStatus.NOT_FOUND, "Plan not found");
//   }

//   let updatedData: any = { ...payload };

//   if (payload.price !== undefined || payload.interval !== undefined) {
//     const newPrice = await stripe.prices.create({
//       unit_amount: Math.round((payload.price ?? plan.price) * 100),
//       currency: (payload.currency ?? plan.currency).toLowerCase(),
//       recurring: {
//         interval: mapIntervalToStripe(
//           payload.interval ?? plan.interval
//         ),
//       },
//       product: plan.stripeProductId,
//     });

//     updatedData.stripePriceId = newPrice.id;
//   }

//   return Plan.findByIdAndUpdate(id, updatedData, {
//     new: true,
//     runValidators: true,
//   });
// };


const updatePlan = async (id: string, payload: any) => {
  const plan = await Plan.findById(id);

  if (!plan) {
    throw new AppError(httpStatus.NOT_FOUND, "Plan not found");
  }

  const updatedData: any = { ...payload };

  if (payload.price !== undefined || payload.interval !== undefined) {
    let productId = plan.stripeProductId;

    // Handle Free to Paid conversion
    if (!productId && (payload.price ?? plan.price) > 0) {
      const stripeProduct = await stripe.products.create({
        name: payload.name || plan.name,
        description: (payload.features || plan.features)?.join(", "),
      });
      productId = stripeProduct.id;
      updatedData.stripeProductId = productId;
    }

    // Create new Stripe Price
    if (productId) {
      const newPrice = await stripe.prices.create({
        unit_amount: Math.round((payload.price ?? plan.price) * 100),
        currency: (payload.currency ?? plan.currency).toLowerCase(),
        recurring: {
          interval: mapIntervalToStripe(payload.interval ?? plan.interval),
        },
        product: productId,
      });

      // Archive old price in Stripe to keep dashboard clean
      if (plan.stripePriceId) {
        await stripe.prices.update(plan.stripePriceId, { active: false });
      }

      updatedData.stripePriceId = newPrice.id;
    }
  }

  return Plan.findByIdAndUpdate(id, updatedData, {
    new: true,
    runValidators: true,
  });
};

const deletePlan = async (id: string) => {
  const plan = await Plan.findById(id);

  if (!plan) {
    throw new AppError(httpStatus.NOT_FOUND, "Plan not found");
  }

  return Plan.findByIdAndUpdate(id, { isActive: false }, { new: true });
};

export const PlanServices = {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
};