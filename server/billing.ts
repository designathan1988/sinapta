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
import { cardBodySchema } from "./billing.schema.ts";
import {
  addInvoice,
  cardOf,
  invoicesOf,
  keepCard,
  removeCard,
  seatsOf,
} from "./billing-store.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import { askerOf, isAsker } from "./member-asker.ts";
import { setWorkspacePlan } from "./members.ts";
import { localProcessor, type PaymentProcessor } from "./payments.ts";

const planSchema = v.object({ plan: v.picklist(PLANS) });

interface Owner {
  readonly workspaceId: string;
  readonly userId: string;
  readonly plan: PlanId;
}

function ownerOf(
  request: ApiRequest,
  context: ApiContext,
): Owner | ApiResponse {
  const asker = askerOf(request, context);
  if (!isAsker(asker)) return asker;
  if (asker.workspace.role !== "owner") {
    return answer(403, { error: "owners-only" });
  }
  const { id, plan } = asker.workspace;
  return { workspaceId: id, userId: asker.user.id, plan };
}

const isOwner = (value: Owner | ApiResponse): value is Owner =>
  "workspaceId" in value;

function processorOf(context: ApiContext): PaymentProcessor {
  return context.payments ?? localProcessor;
}

function billingOf(context: ApiContext, owner: Owner) {
  const card = cardOf(context, owner.workspaceId);
  return {
    plan: owner.plan,
    card:
      card === undefined
        ? null
        : {
            brand: card.brand,
            last4: card.last4,
            expMonth: card.exp_month,
            expYear: card.exp_year,
            name: card.name,
          },
    invoices: invoicesOf(context, owner.workspaceId).map((row) => ({
      id: row.id,
      plan: row.plan,
      seats: row.seats,
      amountCents: row.amount_cents,
      currency: row.currency,
      status: row.status,
      last4: row.last4,
      createdAt: new Date(row.created_at).toISOString(),
    })),
  };
}

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

function addCard(request: ApiRequest, context: ApiContext): ApiResponse {
  const owner = ownerOf(request, context);
  if (!isOwner(owner)) return owner;
  const parsed = v.safeParse(cardBodySchema, request.body);
  if (!parsed.success) return answer(400, { error: "invalid-card" });
  const card = parsed.output;
  const error = cardError(card, context.now());
  if (error !== undefined) return answer(400, { error });
  const digits = cardDigits(card.number);
  const { expMonth, expYear, cvc, name } = card;
  const authorized = processorOf(context).authorize({
    digits,
    expMonth,
    expYear,
    cvc,
  });
  if (!authorized.ok) return answer(402, { error: authorized.error });
  const brand = cardBrand(digits);
  const last4 = digits.slice(-4);
  const kept = { brand, last4, expMonth, expYear, name };
  keepCard(context, owner, { ...kept, token: authorized.token });
  return answer(200, { card: kept });
}

// A paid plan above the current one is charged first; a plan without a
// price, or a move down, is not charged.
function chargeFor(context: ApiContext, owner: Owner, plan: PlanId) {
  const seats = seatsOf(context, owner.workspaceId);
  const amountCents = planCharge(plan, seats) ?? 0;
  const isUp = PLANS.indexOf(plan) > PLANS.indexOf(owner.plan);
  if (amountCents === 0 || !isUp) return undefined;
  const card = cardOf(context, owner.workspaceId);
  if (card === undefined) return answer(402, { error: "payment-required" });
  const charged = processorOf(context).charge(card.token, amountCents);
  const status = charged.ok ? ("paid" as const) : ("failed" as const);
  const invoice = { plan, seats, amountCents, status, last4: card.last4 };
  addInvoice(context, owner.workspaceId, invoice);
  return charged.ok ? undefined : answer(402, { error: charged.error });
}

function changePlan(request: ApiRequest, context: ApiContext): ApiResponse {
  const owner = ownerOf(request, context);
  if (!isOwner(owner)) return owner;
  const { plan } = v.parse(planSchema, request.body);
  const refused = chargeFor(context, owner, plan);
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
};
