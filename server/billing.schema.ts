// Billing's request bodies and rows, parsed at the boundary.
import * as v from "valibot";
import { CARD_BRANDS } from "../src/model/index.ts";

export const cardBodySchema = v.object({
  number: v.pipe(v.string(), v.maxLength(40)),
  expMonth: v.pipe(v.number(), v.integer()),
  expYear: v.pipe(v.number(), v.integer()),
  cvc: v.pipe(v.string(), v.maxLength(4)),
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100)),
});

export const paymentMethodRowSchema = v.object({
  brand: v.picklist(CARD_BRANDS),
  last4: v.string(),
  exp_month: v.number(),
  exp_year: v.number(),
  name: v.string(),
  token: v.string(),
});

export const invoiceRowSchema = v.object({
  id: v.string(),
  plan: v.string(),
  seats: v.number(),
  amount_cents: v.number(),
  currency: v.string(),
  status: v.picklist(["paid", "failed"]),
  last4: v.string(),
  created_at: v.number(),
});

export type PaymentMethodRow = v.InferOutput<typeof paymentMethodRowSchema>;
export type InvoiceRow = v.InferOutput<typeof invoiceRowSchema>;
