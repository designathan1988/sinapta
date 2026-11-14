// A test identity provider inside the server, on only with
// PAGECRAFT_DEV_OIDC=1: it plays the part of Google or a company's SSO so
// the whole sign-in can be tried on this machine. Its page asks which
// address to sign in as; its ID tokens are signed with a key made at start
// and checked by the same code as any provider's.
import {
  createHash,
  generateKeyPairSync,
  randomBytes,
  sign,
} from "node:crypto";
import { answer, type RouteTable } from "./api.ts";
import { DEV_ISSUER } from "./oidc-config.ts";

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const KID = "dev";

interface Grant {
  readonly email: string;
  readonly nonce: string;
  readonly clientId: string;
  readonly challenge: string;
  readonly redirectUri: string;
}

const grants = new Map<string, Grant>();

export const isDevIdentity = (): boolean =>
  process.env.PAGECRAFT_DEV_OIDC === "1";

export function devKeys(): string {
  const jwk = publicKey.export({ format: "jwk" });
  return JSON.stringify({ keys: [{ ...jwk, kid: KID, alg: "RS256" }] });
}

const b64 = (text: string) => Buffer.from(text).toString("base64url");

function idToken(grant: Grant, now: number): string {
  const header = b64(JSON.stringify({ alg: "RS256", kid: KID }));
  const claims = b64(
    JSON.stringify({
      iss: DEV_ISSUER,
      aud: grant.clientId,
      exp: Math.floor(now / 1000) + 600,
      nonce: grant.nonce,
      email: grant.email,
      email_verified: true,
    }),
  );
  const signature = sign(
    "sha256",
    Buffer.from(`${header}.${claims}`),
    privateKey,
  ).toString("base64url");
  return `${header}.${claims}.${signature}`;
}

// The token answer for a code, once, when its proof key matches.
export function devToken(
  fields: Readonly<Record<string, string>>,
  now: number,
): string | undefined {
  const grant = grants.get(fields.code ?? "");
  grants.delete(fields.code ?? "");
  const proof = createHash("sha256")
    .update(fields.code_verifier ?? "")
    .digest("base64url");
  if (grant?.challenge !== proof || fields.redirect_uri !== grant.redirectUri) {
    return undefined;
  }
  return JSON.stringify({ id_token: idToken(grant, now) });
}

const escape = (text: string) =>
  text.replace(/[&<>"']/g, (char) => `&#${String(char.charCodeAt(0))};`);

function page(query: URLSearchParams): string {
  const hidden = [
    "client_id",
    "redirect_uri",
    "state",
    "nonce",
    "code_challenge",
  ]
    .map(
      (name) =>
        `<input type="hidden" name="${name}" value="${escape(query.get(name) ?? "")}">`,
    )
    .join("");
  return `<!doctype html><meta charset="utf-8"><title>Test sign-in</title>
<main style="font:16px system-ui;max-width:24rem;margin:4rem auto">
<h1>Test identity provider</h1>
<p>Sign in to Pagecraft as:</p>
<form method="get" action="/api/dev-idp/approve">${hidden}
<input name="email" type="email" required value="review@pagecraft.test" aria-label="Email">
<button type="submit">Sign in</button></form></main>`;
}

export const DEV_IDP_ROUTES: RouteTable = {
  "GET /api/dev-idp/authorize": (request) =>
    isDevIdentity()
      ? { status: 200, html: page(request.query) }
      : answer(404, { error: "not-found" }),
  "GET /api/dev-idp/approve": (request) => {
    if (!isDevIdentity()) return answer(404, { error: "not-found" });
    const { query } = request;
    const redirectUri = query.get("redirect_uri") ?? "";
    // Only back to this server's own callback.
    if (URL.parse(redirectUri)?.host !== request.host) {
      return answer(400, { error: "bad-redirect" });
    }
    const code = randomBytes(16).toString("base64url");
    grants.set(code, {
      email: query.get("email") ?? "",
      nonce: query.get("nonce") ?? "",
      clientId: query.get("client_id") ?? "",
      challenge: query.get("code_challenge") ?? "",
      redirectUri,
    });
    const back = new URL(redirectUri);
    back.searchParams.set("code", code);
    back.searchParams.set("state", query.get("state") ?? "");
    return { status: 302, location: back.href };
  },
};
