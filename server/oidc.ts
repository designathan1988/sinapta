// Signing in through another company (OpenID Connect, authorization code
// with PKCE): Notion's "Continue with Google", Apple, Microsoft, ChatGPT
// and a company's SSO. The browser goes to the provider and comes back
// with a code; the server trades it for an ID token, checks the token's
// signature with the provider's keys and its claims (issuer, audience,
// expiry, nonce), then signs in the person with that email, making the
// account the first time.
import { createHash, randomBytes } from "node:crypto";
import { signedIn } from "./account-routes.ts";
import { type ApiContext, type RouteTable } from "./api.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import {
  DEV_ISSUER,
  isOidcProvider,
  OIDC_PROVIDERS,
  oidcConfigOf,
  type OidcConfig,
} from "./oidc-config.ts";
import { devKeys, devToken, DEV_IDP_ROUTES } from "./oidc-dev.ts";
import { verifyIdToken } from "./oidc-token.ts";
import {
  readDiscovery,
  readKeys,
  readToken,
  type Discovery,
  type IdClaims,
} from "./oidc.schema.ts";
import { createUser, findUser, nameFromEmail } from "./users.ts";

const STATE_MS = 10 * 60_000;
const random = () => randomBytes(32).toString("base64url");

// Back to the sign-in screen, saying which provider failed.
const failed = (provider: string): ApiResponse => ({
  status: 302,
  location: `/?signin-error=${encodeURIComponent(provider)}`,
});

function callbackOf(request: ApiRequest, context: ApiContext): string {
  const scheme = context.secure ? "https" : "http";
  return `${scheme}://${request.host ?? "localhost"}/api/account/oidc/callback`;
}

// The provider's endpoints: its discovery document, or the test
// provider's own.
async function discover(
  config: OidcConfig,
  request: ApiRequest,
  context: ApiContext,
): Promise<Discovery | undefined> {
  if (config.issuer === DEV_ISSUER) {
    const base = `${context.secure ? "https" : "http"}://${request.host ?? ""}`;
    return {
      issuer: DEV_ISSUER,
      authorization_endpoint: `${base}/api/dev-idp/authorize`,
      token_endpoint: `${base}/api/dev-idp/token`,
      jwks_uri: `${base}/api/dev-idp/keys`,
    };
  }
  const url = new URL(
    `${config.issuer.replace(/\/$/, "")}/.well-known/openid-configuration`,
  );
  return readDiscovery(await context.identity?.getText(url));
}

async function start(
  request: ApiRequest,
  context: ApiContext,
): Promise<ApiResponse> {
  const provider = request.params.provider ?? "";
  const config = isOidcProvider(provider) ? oidcConfigOf(provider) : undefined;
  if (config === undefined) return failed(provider);
  const discovery = await discover(config, request, context);
  if (discovery === undefined) return failed(provider);
  const [state, nonce, verifier] = [random(), random(), random()];
  context.db
    .prepare(
      "INSERT INTO oidc_states (state, provider, nonce, verifier, expires_at) VALUES (?, ?, ?, ?, ?)",
    )
    .run(state, provider, nonce, verifier, context.now() + STATE_MS);
  const url = new URL(discovery.authorization_endpoint);
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  for (const [key, value] of Object.entries({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: callbackOf(request, context),
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  })) {
    url.searchParams.set(key, value);
  }
  return { status: 302, location: url.href };
}

interface Pending {
  readonly provider: string;
  readonly nonce: string;
  readonly verifier: string;
}

function takeState(context: ApiContext, state: string): Pending | undefined {
  const row: unknown = context.db
    .prepare(
      "SELECT provider, nonce, verifier, expires_at FROM oidc_states WHERE state = ?",
    )
    .get(state);
  context.db.prepare("DELETE FROM oidc_states WHERE state = ?").run(state);
  if (typeof row !== "object" || row === null) return undefined;
  const field = (name: string): unknown => Reflect.get(row, name);
  const [provider, nonce, verifier, expires] = [
    field("provider"),
    field("nonce"),
    field("verifier"),
    field("expires_at"),
  ];
  const isValid =
    typeof provider === "string" &&
    typeof nonce === "string" &&
    typeof verifier === "string" &&
    typeof expires === "number" &&
    expires >= context.now();
  return isValid ? { provider, nonce, verifier } : undefined;
}

interface Exchange {
  readonly config: OidcConfig;
  readonly discovery: Discovery;
  readonly fields: Readonly<Record<string, string>>;
}

// The ID token for a code, and the provider's keys to check it with: from
// the provider, or the test provider.
async function tokenFor(
  exchange: Exchange,
  context: ApiContext,
): Promise<{ token: string; keys: string } | undefined> {
  const { config, discovery, fields } = exchange;
  const isDev = config.issuer === DEV_ISSUER;
  const answer = isDev
    ? devToken(fields, context.now())
    : await context.identity?.postForm(
        new URL(discovery.token_endpoint),
        fields,
      );
  const token = readToken(answer)?.id_token;
  const keys = isDev
    ? devKeys()
    : await context.identity?.getText(new URL(discovery.jwks_uri));
  return token === undefined || keys === undefined
    ? undefined
    : { token, keys };
}

// The checked claims for the code the provider sent back, or nothing.
async function claimsFor(
  pending: Pending,
  request: ApiRequest,
  context: ApiContext,
): Promise<IdClaims | undefined> {
  const { provider } = pending;
  const config = isOidcProvider(provider) ? oidcConfigOf(provider) : undefined;
  if (config === undefined) return undefined;
  const discovery = await discover(config, request, context);
  if (discovery === undefined) return undefined;
  const fields = {
    grant_type: "authorization_code",
    code: request.query.get("code") ?? "",
    redirect_uri: callbackOf(request, context),
    client_id: config.clientId,
    code_verifier: pending.verifier,
    ...(config.clientSecret === undefined
      ? {}
      : { client_secret: config.clientSecret }),
  };
  const answered = await tokenFor({ config, discovery, fields }, context);
  if (answered === undefined) return undefined;
  return verifyIdToken(answered.token, readKeys(answered.keys) ?? [], {
    config,
    nonce: pending.nonce,
    now: context.now(),
  });
}

async function callback(
  request: ApiRequest,
  context: ApiContext,
): Promise<ApiResponse> {
  const pending = takeState(context, request.query.get("state") ?? "");
  if (pending === undefined) return failed("");
  const claims = await claimsFor(pending, request, context);
  if (claims === undefined) return failed(pending.provider);
  const email = claims.email.trim().toLowerCase();
  const user =
    findUser(context, email) ??
    createUser(context, {
      email,
      name: claims.name ?? nameFromEmail(email),
      passwordHash: null,
    });
  return { ...signedIn(context, user, 302), location: "/" };
}

export const OIDC_ROUTES: RouteTable = {
  ...DEV_IDP_ROUTES,
  // The providers this server signs in with, for the sign-in screen.
  "GET /api/account/providers": () => ({
    status: 200,
    body: {
      providers: OIDC_PROVIDERS.filter(
        (provider) => oidcConfigOf(provider) !== undefined,
      ),
    },
  }),
  "GET /api/account/oidc/callback": callback,
  "GET /api/account/oidc/:provider/start": start,
};
