// Settings › Billing, as Notion's: the workspace's card, or a form to add
// one, and its invoices. The card's number goes to the server once and is
// not kept here; only the owners see this page.
import "./settings-billing.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { isPlan } from "../../model/index.ts";
import {
  NO_BILLING,
  requestSync,
  type AppState,
  type BillingCard,
  type BillingError,
  type BillingInvoice,
  type BillingState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";

const TEXT = COPY.billing;
const MONEY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const DAY = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

function fieldOf(form: HTMLFormElement, name: string): string {
  const value = new FormData(form).get(name);
  return typeof value === "string" ? value.trim() : "";
}

// "MM/YY" or "MM/YYYY" as a month and a full year; NaN when unreadable,
// which the server refuses.
function expiryOf(text: string): { expMonth: number; expYear: number } {
  const [month = "", year = ""] = text.split("/").map((part) => part.trim());
  const full = year.length === 2 ? `20${year}` : year;
  return { expMonth: Number(month), expYear: Number(full) };
}

function onSubmit(dispatch: Dispatch) {
  return (event: SubmitEvent): void => {
    event.preventDefault();
    if (!(event.currentTarget instanceof HTMLFormElement)) return;
    const form = event.currentTarget;
    const card = {
      number: fieldOf(form, "number"),
      ...expiryOf(fieldOf(form, "expiry")),
      cvc: fieldOf(form, "cvc"),
      name: fieldOf(form, "name"),
    };
    form.reset();
    dispatch(requestSync.create({ request: { kind: "add-card", card } }));
  };
}

interface FieldSpec {
  readonly name: string;
  readonly label: string;
  // The browser's name for it, so a saved card can fill it.
  readonly autocomplete: string;
  readonly mode: string;
}

function field(spec: FieldSpec): TemplateResult {
  return html`<label class="settings-billing__label">
    <span class="settings__name">${spec.label}</span>
    <input
      class="settings__field"
      name=${spec.name}
      inputmode=${spec.mode}
      autocomplete=${spec.autocomplete}
      required
    />
  </label>`;
}

function renderCardForm(dispatch: Dispatch): TemplateResult {
  return html`<form
    class="settings-billing__form"
    @submit=${onSubmit(dispatch)}
  >
    ${field({ name: "number", label: TEXT.cardNumber, autocomplete: "cc-number", mode: "numeric" })}
    <div class="settings-billing__pair">
      ${field({ name: "expiry", label: TEXT.expiry, autocomplete: "cc-exp", mode: "numeric" })}
      ${field({ name: "cvc", label: TEXT.cvc, autocomplete: "cc-csc", mode: "numeric" })}
    </div>
    ${field({ name: "name", label: TEXT.nameOnCard, autocomplete: "cc-name", mode: "text" })}
    <button type="submit" class="button" data-variant="primary">
      ${TEXT.saveCard}
    </button>
    <p class="settings__hint">${TEXT.processorNote}</p>
  </form>`;
}

function renderCard(card: BillingCard, dispatch: Dispatch): TemplateResult {
  return html`<div class="settings__row">
    <span class="settings-billing__card">
      ${renderIcon("card")}
      <span class="settings__text">
        <span class="settings__name"
          >${TEXT.cardLine(card.brand, card.last4)}</span
        >
        <span class="settings__hint"
          >${card.name} · ${TEXT.expires(card.expMonth, card.expYear)}</span
        >
      </span>
    </span>
    ${renderButton({
      label: TEXT.removeCard,
      onClick: () =>
        dispatch(requestSync.create({ request: { kind: "remove-card" } })),
    })}
  </div>`;
}

function renderInvoice(invoice: BillingInvoice): TemplateResult {
  const plan = isPlan(invoice.plan)
    ? COPY.plans.names[invoice.plan]
    : invoice.plan;
  return html`<tr>
    <td>${DAY.format(new Date(invoice.createdAt))}</td>
    <td>${TEXT.invoiceLine(plan, invoice.seats)}</td>
    <td>${MONEY.format(invoice.amountCents / 100)}</td>
    <td data-status=${invoice.status}>
      ${invoice.status === "paid" ? TEXT.paid : TEXT.failed}
    </td>
  </tr>`;
}

function renderInvoices(invoices: readonly BillingInvoice[]): TemplateResult {
  if (invoices.length === 0) {
    return html`<p class="settings__hint">${TEXT.noInvoices}</p>`;
  }
  return html`<table class="settings-billing__invoices">
    <tbody>
      ${invoices.map(renderInvoice)}
    </tbody>
  </table>`;
}

export function renderBilling(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const { workspaces, workspaceId, billing } = state.persistence.sync;
  if (workspaceId === null) {
    return html`<p class="settings__hint">${TEXT.signedOut}</p>`;
  }
  const role = workspaces.find((each) => each.id === workspaceId)?.role;
  if (role !== "owner") {
    return html`<p class="settings__hint">${TEXT.ownersOnly}</p>`;
  }
  const shown = billing ?? NO_BILLING;
  return html`<h4 class="settings__subtitle">${TEXT.paymentMethod}</h4>
    ${renderError(shown.error)} ${renderMethod(shown, dispatch)}
    <h4 class="settings__subtitle">${TEXT.invoices}</h4>
    ${renderInvoices(shown.invoices)}`;
}

function renderError(error: BillingError | null) {
  if (error === null) return nothing;
  return html`<p class="settings__message" data-error role="alert">
    ${TEXT.errors[error]}
  </p>`;
}

// The card kept, or a way to add one: the form, or with Stripe its own
// page, where the card's number is typed.
function renderMethod(billing: BillingState, dispatch: Dispatch) {
  if (billing.card !== null) return renderCard(billing.card, dispatch);
  if (billing.processor === "stripe") {
    return html`<p class="settings__hint">${TEXT.noCard}</p>
      ${renderButton({
        label: TEXT.addCard,
        icon: "card",
        variant: "primary",
        onClick: () =>
          dispatch(requestSync.create({ request: { kind: "checkout" } })),
      })}
      <p class="settings__hint">${TEXT.stripeNote}</p>`;
  }
  return html`<p class="settings__hint">${TEXT.noCard}</p>
    ${renderCardForm(dispatch)}`;
}
