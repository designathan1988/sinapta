// A workspace's plan, as Notion's: Free, Plus, Business or Enterprise.
// On this server every plan is free to choose; each keeps Notion's own
// limits on a file's size and on how far back a page's history goes.
import { MAX_ASSET_BYTES } from "./asset.schema.ts";

export const PLANS = ["free", "plus", "business", "enterprise"] as const;
export type PlanId = (typeof PLANS)[number];

export interface PlanLimits {
  // The largest file a block may hold, in bytes.
  readonly uploadBytes: number;
  // How many days of a page's versions are shown; null for all.
  readonly historyDays: number | null;
}

const MB = 1024 * 1024;

export const PLAN_LIMITS: Readonly<Record<PlanId, PlanLimits>> = {
  free: { uploadBytes: 5 * MB, historyDays: 7 },
  plus: { uploadBytes: MAX_ASSET_BYTES, historyDays: 30 },
  business: { uploadBytes: MAX_ASSET_BYTES, historyDays: 90 },
  enterprise: { uploadBytes: MAX_ASSET_BYTES, historyDays: null },
};

export function isPlan(value: unknown): value is PlanId {
  return PLANS.some((plan) => plan === value);
}
