export const PLAN_INTERVAL = ["DAY", "WEEK", "MONTH", "YEAR"] as const;

export type TPlanInterval = (typeof PLAN_INTERVAL)[number];