// The card processor this server pays through (ADR-0014, decision 12).
// With Stripe registered (PAGECRAFT_STRIPE_SECRET_KEY), cards are entered
// on Stripe's own page and charged through Stripe; with none, the server
// is its own processor, as the sign-in has its own test provider: a card
// that passes its checks is accepted and charged at once, and the card
// networks' published test numbers decline as they do at a real one.
import { randomUUID } from "node:crypto";
import type { CardBrand } from "../src/model/index.ts";

export interface CardToAuthorize {
  readonly digits: string;
  readonly expMonth: number;
  readonly expYear: number;
  readonly cvc: string;
}

export type Authorization =
  | { readonly ok: true; readonly token: string }
  | { readonly ok: false; readonly error: "card-declined" };

export type Charge =
  | { readonly ok: true; readonly id: string }
  | { readonly ok: false; readonly error: "card-declined" };

// A card saved on the processor's own page, as it hands it back.
export interface HostedCard {
  readonly workspaceId: string;
  readonly token: string;
  readonly brand: CardBrand;
  readonly last4: string;
  readonly expMonth: number;
  readonly expYear: number;
  readonly name: string;
}

export interface CheckoutStart {
  readonly workspaceId: string;
  // Where the processor's page sends the person back to.
  readonly returnUrl: string;
  readonly cancelUrl: string;
}

export interface PaymentProcessor {
  readonly kind: "local" | "stripe";
  // A card typed into the app; only the server's own processor takes one.
  readonly authorize?: (card: CardToAuthorize) => Promise<Authorization>;
  // A card typed on the processor's page: where to send the person, and
  // the card once they come back.
  readonly startCheckout?: (
    start: CheckoutStart,
  ) => Promise<string | undefined>;
  readonly finishCheckout?: (
    sessionId: string,
  ) => Promise<HostedCard | undefined>;
  readonly charge: (token: string, amountCents: number) => Promise<Charge>;
}

// The test numbers: one declined when it is added, one accepted then
// declined on every charge.
const DECLINED = "4000000000000002";
const DECLINES_CHARGES = "4000000000000341";
const FAILING = "tok_fails_";

export const localProcessor: PaymentProcessor = {
  kind: "local",
  authorize(card) {
    if (card.digits === DECLINED) {
      return Promise.resolve({ ok: false, error: "card-declined" });
    }
    const kind = card.digits === DECLINES_CHARGES ? FAILING : "tok_";
    return Promise.resolve({ ok: true, token: `${kind}${randomUUID()}` });
  },
  charge(token) {
    if (token.startsWith(FAILING)) {
      return Promise.resolve({ ok: false, error: "card-declined" });
    }
    return Promise.resolve({ ok: true, id: `ch_${randomUUID()}` });
  },
};
