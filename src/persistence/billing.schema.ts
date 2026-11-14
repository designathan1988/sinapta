// Settings › Billing as the server answers it, parsed at the boundary.
import * as v from "valibot";
import { BILLING_ERRORS } from "../state/index.ts";

const billingSchema = v.object({
  card: v.nullable(
    v.object({
      brand: v.string(),
      last4: v.string(),
      expMonth: v.number(),
      expYear: v.number(),
      name: v.string(),
    }),
  ),
  invoices: v.array(
    v.object({
      id: v.string(),
      plan: v.string(),
      seats: v.number(),
      amountCents: v.number(),
      currency: v.string(),
      status: v.picklist(["paid", "failed"]),
      last4: v.string(),
      createdAt: v.string(),
    }),
  ),
});

const refusalSchema = v.object({ error: v.picklist(BILLING_ERRORS) });

export function readBilling(value: unknown) {
  const parsed = v.safeParse(billingSchema, value);
  return parsed.success ? parsed.output : undefined;
}

export function readBillingRefusal(value: unknown) {
  const parsed = v.safeParse(refusalSchema, value);
  return parsed.success ? parsed.output.error : undefined;
}
