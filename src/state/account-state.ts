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
  "wrong-password" | "wrong-code" | "email-taken" | "not-connected" | "network";

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
  | { readonly kind: "sign-out" };

// What the server's answer means for the screen.
export type AccountAnswer =
  | { readonly kind: "user"; readonly user: AccountUser }
  | { readonly kind: "signed-out" }
  | { readonly kind: "offline" }
  | { readonly kind: "step"; readonly step: AccountStep }
  | { readonly kind: "error"; readonly error: AccountError };

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
