import { Types } from "mongoose";
import { TPlanInterval } from "./plan.constant";

export interface IPlanAccessProduct {
  product: Types.ObjectId;
  fileAccess: "basic" | "pro" | "vip";
}

export interface IPlanAccess {
  products: IPlanAccessProduct[];
  courses: Types.ObjectId[];
  bundles: Types.ObjectId[];
}

export interface IPlan {
  name: string;
  price: number;
  currency?: string;
  interval: TPlanInterval;
  features?: string[];
  isActive?: boolean;
  stripeProductId: string;
  stripePriceId: string;
  access: IPlanAccess;
}