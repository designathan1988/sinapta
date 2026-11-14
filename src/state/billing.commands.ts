// Settings › Billing as the server answers it: the workspace's card (its
// brand, last four digits and expiry), the invoices, and why the last
// request was refused. A card's number lives only in the request that
// sends it, which goes once it is answered.
import type { PlanId } from "../model/index.ts";
import { defineCommand } from "./command-registry.ts";

export interface CardInput {
  readonly number: string;
  readonly expMonth: number;
  readonly expYear: number;
  readonly cvc: string;
  readonly name: string;
}

export interface BillingCard {
  readonly brand: string;
  readonly last4: string;
  readonly expMonth: number;
  readonly expYear: number;
  readonly name: string;
}

export interface BillingInvoice {
  readonly id: string;
  readonly plan: string;
  readonly seats: number;
  readonly amountCents: number;
  readonly currency: string;
  readonly status: "paid" | "failed";
  readonly last4: string;
  readonly createdAt: string;
}

export const BILLING_ERRORS = [
  "invalid-card",
  "invalid-cvc",
  "expired-card",
  "card-declined",
  "payment-required",
  "owners-only",
] as const;
export type BillingError = (typeof BILLING_ERRORS)[number];

export interface BillingState {
  // Who takes the card: this server, or Stripe on its own page.
  readonly processor: "local" | "stripe";
  readonly card: BillingCard | null;
  readonly invoices: readonly BillingInvoice[];
  readonly error: BillingError | null;
  // The plan a refused upgrade asked for, to retry once a card is added.
  readonly wanted: PlanId | null;
}

export const NO_BILLING: BillingState = {
  processor: "local",
  card: null,
  invoices: [],
  error: null,
  wanted: null,
};

export const setBilling = defineCommand<{
  processor?: "local" | "stripe";
  card: BillingCard | null;
  invoices: readonly BillingInvoice[];
}>({
  type: "sync.setBilling",
  handle: (state, { processor, card, invoices }) => {
    const { sync } = state.persistence;
    const isCardSent = sync.request?.kind === "add-card";
    const known = sync.billing ?? NO_BILLING;
    const billing = {
      ...known,
      processor: processor ?? known.processor,
      card,
      invoices,
    };
    const next = {
      ...sync,
      billing: { ...billing, error: null },
      ...(isCardSent && { request: null }),
    };
    return { persistence: { ...state.persistence, sync: next } };
  },
});

export const setBillingError = defineCommand<{
  error: BillingError | null;
  wanted?: PlanId;
}>({
  type: "sync.setBillingError",
  handle: (state, { error, wanted }) => {
    const { sync } = state.persistence;
    const isCardSent = sync.request?.kind === "add-card";
    const billing = {
      ...(sync.billing ?? NO_BILLING),
      error,
      wanted: wanted ?? null,
    };
    const next = { ...sync, billing, ...(isCardSent && { request: null }) };
    return { persistence: { ...state.persistence, sync: next } };
  },
});

export const billingCommands = [setBilling, setBillingError];
