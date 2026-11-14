// The account on the server (ADR-0013): who is signed in, and where the
// sign-in screen stands. The persistence layer does the asking; the store
// records what was asked and what came back.

export interface AccountUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly photo: string | null;
}

// "local": no server answered, the app works on the browser's copy alone.
export type AccountStatus = "local" | "checking" | "signed-out" | "signed-in";

// Notion's sign-in steps: the address, then a password, a login code, or
// the profile of a new account.
export type AccountStep = "email" | "password" | "code" | "profile";

export type AccountError =
  | "wrong-password"
  | "wrong-code"
  | "email-taken"
  | "not-connected"
  | "passkey-refused"
  | "network";

export type AccountRequest =
  | { readonly kind: "lookup"; readonly email: string }
  | {
      readonly kind: "sign-in";
      readonly email: string;
      readonly password: string;
    }
  | { readonly kind: "send-code"; readonly email: string }
  | {
      readonly kind: "verify-code";
      readonly email: string;
      readonly code: string;
    }
  | {
      readonly kind: "sign-up";
      readonly email: string;
      readonly name: string;
      readonly password: string;
    }
  | { readonly kind: "sign-out" }
  // A passkey: signing in with one, adding one, and how many there are.
  | { readonly kind: "passkey-sign-in" }
  | { readonly kind: "passkey-add" }
  | { readonly kind: "passkeys" }
  | { readonly kind: "remove-passkey"; readonly id: string };

// What the server's answer means for the screen.
export type AccountAnswer =
  | { readonly kind: "user"; readonly user: AccountUser }
  | { readonly kind: "signed-out" }
  | { readonly kind: "offline" }
  | { readonly kind: "step"; readonly step: AccountStep }
  | { readonly kind: "error"; readonly error: AccountError }
  | { readonly kind: "passkeys"; readonly passkeys: readonly PasskeySummary[] };

export interface PasskeySummary {
  readonly id: string;
  // When it was added, in milliseconds.
  readonly createdAt: number;
}

export interface AccountState {
  readonly status: AccountStatus;
  readonly user: AccountUser | null;
  readonly step: AccountStep;
  readonly email: string;
  readonly error: AccountError | null;
  // The sign-in a person chose that this server does not offer, as Google.
  readonly provider: string | null;
  // The question being asked of the server, and a count of questions: the
  // persistence layer asks each one once.
  readonly request: AccountRequest | null;
  readonly requestCount: number;
  // The account's passkeys, once the server has said.
  readonly passkeys?: readonly PasskeySummary[];
}

export const SIGNED_OUT_LOCAL: AccountState = {
  status: "local",
  user: null,
  step: "email",
  email: "",
  error: null,
  provider: null,
  request: null,
  requestCount: 0,
};
