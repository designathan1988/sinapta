// Billing's rows: the workspace's card and its invoices.
import { randomUUID } from "node:crypto";
import type { CardBrand, PlanId } from "../src/model/index.ts";
import type { ApiContext } from "./api.ts";
import {
  invoiceRowSchema,
  paymentMethodRowSchema,
  type InvoiceRow,
  type PaymentMethodRow,
} from "./billing.schema.ts";
import { countRowSchema, readRow, readRows } from "./rows.schema.ts";

export interface KeptCard {
  readonly brand: CardBrand;
  readonly last4: string;
  readonly expMonth: number;
  readonly expYear: number;
  readonly name: string;
  readonly token: string;
}

export function cardOf(
  context: ApiContext,
  workspaceId: string,
): PaymentMethodRow | undefined {
  const row = context.db
    .prepare(
      "SELECT brand, last4, exp_month, exp_year, name, token FROM payment_methods WHERE workspace_id = ?",
    )
    .get(workspaceId);
  return readRow(paymentMethodRowSchema, row);
}

export function keepCard(
  context: ApiContext,
  at: { readonly workspaceId: string; readonly userId: string },
  card: KeptCard,
): void {
  context.db
    .prepare(
      "INSERT OR REPLACE INTO payment_methods (workspace_id, brand, last4, exp_month, exp_year, name, token, added_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      at.workspaceId,
      card.brand,
      card.last4,
      card.expMonth,
      card.expYear,
      card.name,
      card.token,
      at.userId,
      context.now(),
    );
}

export function removeCard(context: ApiContext, workspaceId: string): void {
  context.db
    .prepare("DELETE FROM payment_methods WHERE workspace_id = ?")
    .run(workspaceId);
}

export function invoicesOf(
  context: ApiContext,
  workspaceId: string,
): InvoiceRow[] {
  const rows = context.db
    .prepare(
      "SELECT id, plan, seats, amount_cents, currency, status, last4, created_at FROM invoices WHERE workspace_id = ? ORDER BY created_at DESC, rowid DESC",
    )
    .all(workspaceId);
  return readRows(invoiceRowSchema, rows);
}

export interface NewInvoice {
  readonly plan: PlanId;
  readonly seats: number;
  readonly amountCents: number;
  readonly status: "paid" | "failed";
  readonly last4: string;
}

export function addInvoice(
  context: ApiContext,
  workspaceId: string,
  invoice: NewInvoice,
): void {
  context.db
    .prepare(
      "INSERT INTO invoices (id, workspace_id, plan, seats, amount_cents, currency, status, last4, created_at) VALUES (?, ?, ?, ?, ?, 'usd', ?, ?, ?)",
    )
    .run(
      `in_${randomUUID()}`,
      workspaceId,
      invoice.plan,
      invoice.seats,
      invoice.amountCents,
      invoice.status,
      invoice.last4,
      context.now(),
    );
}

// The members a plan is paid for: everyone but guests, as Notion counts.
export function seatsOf(context: ApiContext, workspaceId: string): number {
  const row = context.db
    .prepare(
      "SELECT COUNT(*) AS count FROM members WHERE workspace_id = ? AND role != 'guest'",
    )
    .get(workspaceId);
  return readRow(countRowSchema, row)?.count ?? 1;
}
