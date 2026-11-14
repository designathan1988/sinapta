// Settings › Billing and the plan's price, as Notion's (ADR-0014,
// decision 12): the workspace's card, checked and handed to the payment
// processor, which keeps the number; a paid plan charged to it for each
// member, and every charge kept as an invoice. Only owners see or change
// any of it.
import * as v from "valibot";
import {
  cardBrand,
  cardDigits,
  isLuhnValid,
  isUnexpired,
  planCharge,
  PLANS,
  type PlanId,
} from "../src/model/index.ts";
import { answer, type ApiContext, type RouteTable } from "./api.ts";
import { CHECKOUT_ROUTES } from "./billing-checkout.ts";
import {
  billingOf,
  isOwner,
  ownerOf,
  processorOf,
  type Owner,
} from "./billing-owner.ts";
import { cardBodySchema } from "./billing.schema.ts";
import {
  addInvoice,
  cardOf,
  keepCard,
  removeCard,
  seatsOf,
} from "./billing-store.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import { setWorkspacePlan } from "./members.ts";

const planSchema = v.object({ plan: v.picklist(PLANS) });

// The card's own checks, before the processor sees it.
function cardError(
  card: v.InferOutput<typeof cardBodySchema>,
  now: number,
): string | undefined {
  const digits = cardDigits(card.number);
  if (!isLuhnValid(digits)) return "invalid-card";
  if (!/^\d{3,4}$/.test(card.cvc)) return "invalid-cvc";
  const today = new Date(now);
  const month = today.getUTCMonth() + 1;
  const expiry = { month: card.expMonth, year: card.expYear };
  if (!isUnexpired(expiry, { month, year: today.getUTCFullYear() })) {
    return "expired-card";
  }
  return undefined;
}

// A card typed into the app, for the server's own processor; with one
// that takes cards on its own page, the app sends the person there.
async function addCard(
  request: ApiRequest,
  context: ApiContext,
): Promise<ApiResponse> {
  const owner = ownerOf(request, context);
  if (!isOwner(owner)) return owner;
  const { authorize } = processorOf(context);
  if (authorize === undefined) return answer(409, { error: "hosted-checkout" });
  const parsed = v.safeParse(cardBodySchema, request.body);
  if (!parsed.success) return answer(400, { error: "invalid-card" });
  const card = parsed.output;
  const error = cardError(card, context.now());
  if (error !== undefined) return answer(400, { error });
  const digits = cardDigits(card.number);
  const { expMonth, expYear, cvc, name } = card;
  const authorized = await authorize({ digits, expMonth, expYear, cvc });
  if (!authorized.ok) return answer(402, { error: authorized.error });
  const kept = { brand: cardBrand(digits), last4: digits.slice(-4) };
  const shown = { ...kept, expMonth, expYear, name };
  keepCard(context, owner, { ...shown, token: authorized.token });
  return answer(200, { card: shown });
}

// A paid plan above the current one is charged first; a plan without a
// price, or a move down, is not charged.
async function chargeFor(
  context: ApiContext,
  owner: Owner,
  plan: PlanId,
): Promise<ApiResponse | undefined> {
  const seats = seatsOf(context, owner.workspaceId);
  const amountCents = planCharge(plan, seats) ?? 0;
  const isUp = PLANS.indexOf(plan) > PLANS.indexOf(owner.plan);
  if (amountCents === 0 || !isUp) return undefined;
  const card = cardOf(context, owner.workspaceId);
  if (card === undefined) return answer(402, { error: "payment-required" });
  const charged = await processorOf(context).charge(card.token, amountCents);
  const status = charged.ok ? ("paid" as const) : ("failed" as const);
  const invoice = { plan, seats, amountCents, status, last4: card.last4 };
  addInvoice(context, owner.workspaceId, invoice);
  return charged.ok ? undefined : answer(402, { error: charged.error });
}

async function changePlan(
  request: ApiRequest,
  context: ApiContext,
): Promise<ApiResponse> {
  const owner = ownerOf(request, context);
  if (!isOwner(owner)) return owner;
  const { plan } = v.parse(planSchema, request.body);
  const refused = await chargeFor(context, owner, plan);
  if (refused !== undefined) return refused;
  setWorkspacePlan(context, owner.workspaceId, plan);
  return answer(204);
}

export const BILLING_ROUTES: RouteTable = {
  "GET /api/workspaces/:id/billing": (request, context) => {
    const owner = ownerOf(request, context);
    if (!isOwner(owner)) return owner;
    return answer(200, billingOf(context, owner));
  },
  "POST /api/workspaces/:id/billing/card": addCard,
  "POST /api/workspaces/:id/billing/card/remove": (request, context) => {
    const owner = ownerOf(request, context);
    if (!isOwner(owner)) return owner;
    removeCard(context, owner.workspaceId);
    return answer(200, billingOf(context, owner));
  },
  "POST /api/workspaces/:id/plan": changePlan,
  ...CHECKOUT_ROUTES,
};
