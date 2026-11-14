// The card processor this server pays through. With no payment provider
// registered, it is its own, as the sign-in has its own test provider
// (ADR-0014, decision 12): a card that passes its checks is accepted and
// charged at once, and the card networks' published test numbers decline
// as they do at a real processor.
import { randomUUID } from "node:crypto";

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

export interface PaymentProcessor {
  readonly authorize: (card: CardToAuthorize) => Authorization;
  readonly charge: (token: string, amountCents: number) => Charge;
}

// The test numbers: one declined when it is added, one accepted then
// declined on every charge.
const DECLINED = "4000000000000002";
const DECLINES_CHARGES = "4000000000000341";
const FAILING = "tok_fails_";

export const localProcessor: PaymentProcessor = {
  authorize(card) {
    if (card.digits === DECLINED) return { ok: false, error: "card-declined" };
    const kind = card.digits === DECLINES_CHARGES ? FAILING : "tok_";
    return { ok: true, token: `${kind}${randomUUID()}` };
  },
  charge(token) {
    if (token.startsWith(FAILING)) return { ok: false, error: "card-declined" };
    return { ok: true, id: `ch_${randomUUID()}` };
  },
};
