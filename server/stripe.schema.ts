// Stripe's answers, parsed at the boundary: a customer, a Checkout
// session with its saved card, and a payment.
import * as v from "valibot";
import { CARD_BRANDS, type CardBrand } from "../src/model/index.ts";
import type { HostedCard } from "./payments.ts";

const idSchema = v.object({ id: v.string() });

const sessionSchema = v.object({
  id: v.string(),
  url: v.nullable(v.string()),
});

const finishedSchema = v.object({
  status: v.literal("complete"),
  customer: v.string(),
  metadata: v.object({ workspace: v.string() }),
  setup_intent: v.object({
    payment_method: v.object({
      id: v.string(),
      billing_details: v.object({ name: v.nullable(v.string()) }),
      card: v.object({
        brand: v.string(),
        last4: v.string(),
        exp_month: v.number(),
        exp_year: v.number(),
      }),
    }),
  }),
});

const paymentSchema = v.object({ id: v.string(), status: v.string() });

function brandOf(name: string): CardBrand {
  return CARD_BRANDS.find((brand) => brand === name) ?? "card";
}

export function readId(value: unknown): string | undefined {
  const parsed = v.safeParse(idSchema, value);
  return parsed.success ? parsed.output.id : undefined;
}

export function readSessionUrl(value: unknown): string | undefined {
  const parsed = v.safeParse(sessionSchema, value);
  return parsed.success ? (parsed.output.url ?? undefined) : undefined;
}

export function readFinished(value: unknown): HostedCard | undefined {
  const parsed = v.safeParse(finishedSchema, value);
  if (!parsed.success) return undefined;
  const { customer, metadata, setup_intent: intent } = parsed.output;
  const method = intent.payment_method;
  return {
    workspaceId: metadata.workspace,
    token: `${customer}|${method.id}`,
    brand: brandOf(method.card.brand),
    last4: method.card.last4,
    expMonth: method.card.exp_month,
    expYear: method.card.exp_year,
    name: method.billing_details.name ?? "",
  };
}

export function readPayment(value: unknown) {
  const parsed = v.safeParse(paymentSchema, value);
  return parsed.success ? parsed.output : undefined;
}

// Stripe's JSON as text, read at the boundary.
export function parseStripeJson(text: string): unknown {
  try {
    const value: unknown = JSON.parse(text);
    return value;
  } catch {
    return undefined;
  }
}
