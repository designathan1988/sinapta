// Who may see and change a workspace's billing (its owners), the payment
// processor in use, and Billing as the client reads it.
import type { PlanId } from "../src/model/index.ts";
import { answer, type ApiContext } from "./api.ts";
import { cardOf, invoicesOf } from "./billing-store.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import { askerOf, isAsker } from "./member-asker.ts";
import { localProcessor, type PaymentProcessor } from "./payments.ts";

export interface Owner {
  readonly workspaceId: string;
  readonly userId: string;
  readonly plan: PlanId;
}

export function ownerOf(
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

export const isOwner = (value: Owner | ApiResponse): value is Owner =>
  "workspaceId" in value;

export function processorOf(context: ApiContext): PaymentProcessor {
  return context.payments ?? localProcessor;
}

function cardShown(context: ApiContext, workspaceId: string) {
  const card = cardOf(context, workspaceId);
  if (card === undefined) return null;
  return {
    brand: card.brand,
    last4: card.last4,
    expMonth: card.exp_month,
    expYear: card.exp_year,
    name: card.name,
  };
}

export function billingOf(context: ApiContext, owner: Owner) {
  return {
    plan: owner.plan,
    processor: processorOf(context).kind,
    card: cardShown(context, owner.workspaceId),
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
