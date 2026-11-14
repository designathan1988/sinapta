// Stripe as the payment processor, once the server's owner registers it
// (PAGECRAFT_STRIPE_SECRET_KEY): a card is saved on Stripe Checkout's own
// page (setup mode), so its number never reaches this server, and each
// plan is charged off session to the saved card (ADR-0014, decision 12).
import {
  localProcessor,
  type Charge,
  type PaymentProcessor,
} from "./payments.ts";
import {
  parseStripeJson,
  readFinished,
  readId,
  readPayment,
  readSessionUrl,
} from "./stripe.schema.ts";

// Stripe's API as the server reaches it: form posts and reads, each
// answered with JSON, or undefined when Stripe refuses or cannot be
// reached.
export interface StripeWeb {
  readonly post: (
    path: string,
    fields: Readonly<Record<string, string>>,
  ) => Promise<unknown>;
  readonly get: (path: string) => Promise<unknown>;
}

const API = "https://api.stripe.com";
const TIME_LIMIT_MS = 10000;

async function call(
  secret: string,
  path: string,
  body?: string,
): Promise<unknown> {
  try {
    const response = await fetch(`${API}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      ...(body === undefined ? {} : { body }),
      signal: AbortSignal.timeout(TIME_LIMIT_MS),
    });
    return response.ok ? parseStripeJson(await response.text()) : undefined;
  } catch {
    return undefined;
  }
}

export function webStripe(secret: string): StripeWeb {
  return {
    post: (path, fields) =>
      call(secret, path, new URLSearchParams(fields).toString()),
    get: (path) => call(secret, path),
  };
}

// A charge to the saved card while its owner is away (off session); a
// decline, or Stripe out of reach, leaves it unpaid.
async function chargeSaved(
  web: StripeWeb,
  token: string,
  amountCents: number,
): Promise<Charge> {
  const [customer = "", method = ""] = token.split("|");
  const paid = readPayment(
    await web.post("/v1/payment_intents", {
      amount: String(amountCents),
      currency: "usd",
      customer,
      payment_method: method,
      off_session: "true",
      confirm: "true",
    }),
  );
  return paid?.status === "succeeded"
    ? { ok: true, id: paid.id }
    : { ok: false, error: "card-declined" };
}

export function stripeProcessor(web: StripeWeb): PaymentProcessor {
  return {
    kind: "stripe",
    async startCheckout({ workspaceId, returnUrl, cancelUrl }) {
      const customer = readId(
        await web.post("/v1/customers", { "metadata[workspace]": workspaceId }),
      );
      if (customer === undefined) return undefined;
      const session = await web.post("/v1/checkout/sessions", {
        mode: "setup",
        currency: "usd",
        customer,
        "payment_method_types[0]": "card",
        success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        "metadata[workspace]": workspaceId,
      });
      return readSessionUrl(session);
    },
    async finishCheckout(sessionId) {
      const id = encodeURIComponent(sessionId);
      const path = `/v1/checkout/sessions/${id}?expand[]=setup_intent.payment_method`;
      return readFinished(await web.get(path));
    },
    charge: (token, amountCents) => chargeSaved(web, token, amountCents),
  };
}

// The processor the server's environment registers, else its own.
export function registeredProcessor(): PaymentProcessor {
  const secret = process.env.PAGECRAFT_STRIPE_SECRET_KEY;
  return secret === undefined || secret === ""
    ? localProcessor
    : stripeProcessor(webStripe(secret));
}
