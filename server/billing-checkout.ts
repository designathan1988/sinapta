// A card saved on the payment processor's own page (Stripe Checkout): the
// owner is sent there from Billing, and back here once the card is saved,
// where the server asks the processor for it and keeps its brand, last
// four digits, expiry and token (ADR-0014, decision 12).
import type { ApiContext, RouteTable } from "./api.ts";
import { answer } from "./api.ts";
import { isOwner, ownerOf, processorOf } from "./billing-owner.ts";
import { keepCard } from "./billing-store.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import { sessionUser } from "./sessions.ts";
import { membership } from "./workspaces.ts";

const RETURN_PATH = "/api/billing/checkout/return";

function originOf(request: ApiRequest, context: ApiContext): string {
  return `${context.secure ? "https" : "http"}://${request.host ?? "localhost"}`;
}

const back = (outcome: string): ApiResponse => ({
  status: 302,
  location: `/?billing=${outcome}`,
});

async function startCheckout(
  request: ApiRequest,
  context: ApiContext,
): Promise<ApiResponse> {
  const owner = ownerOf(request, context);
  if (!isOwner(owner)) return owner;
  const { startCheckout: start } = processorOf(context);
  if (start === undefined) return answer(409, { error: "card-in-app" });
  const origin = originOf(request, context);
  const url = await start({
    workspaceId: owner.workspaceId,
    returnUrl: `${origin}${RETURN_PATH}`,
    cancelUrl: `${origin}/?billing=cancelled`,
  });
  return url === undefined ? back("failed") : { status: 302, location: url };
}

// Back from the processor's page: the card is kept for the workspace the
// session was made for, if the person is still one of its owners.
async function finishCheckout(
  request: ApiRequest,
  context: ApiContext,
): Promise<ApiResponse> {
  const user = sessionUser(context, request);
  const sessionId = request.query.get("session_id");
  const { finishCheckout: finish } = processorOf(context);
  if (user === undefined || sessionId === null || finish === undefined) {
    return back("failed");
  }
  const card = await finish(sessionId);
  if (card === undefined) return back("failed");
  const workspace = membership(context, card.workspaceId, user.id);
  if (workspace?.role !== "owner") return back("failed");
  const at = { workspaceId: workspace.id, userId: user.id };
  keepCard(context, at, card);
  return back("saved");
}

export const CHECKOUT_ROUTES: RouteTable = {
  "GET /api/workspaces/:id/billing/checkout": startCheckout,
  [`GET ${RETURN_PATH}`]: finishCheckout,
};
