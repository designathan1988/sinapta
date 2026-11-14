import { generateKeyPairSync, sign } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestServer } from "./test-context.ts";

// A company's identity provider, as the server reaches it: its discovery
// document, its keys, and its token endpoint, which signs an ID token.
const ISSUER = "https://idp.example.com";
const NOW = Date.UTC(2026, 10, 14);

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

function signed(claims: Record<string, unknown>, key = privateKey): string {
  const b64 = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const head = b64({ alg: "RS256", kid: "k1" });
  const body = b64(claims);
  const signature = sign("sha256", Buffer.from(`${head}.${body}`), key);
  return `${head}.${body}.${signature.toString("base64url")}`;
}

beforeEach(() => {
  vi.stubEnv("PAGECRAFT_DEV_OIDC", "");
  vi.stubEnv("PAGECRAFT_OIDC_SSO_ISSUER", ISSUER);
  vi.stubEnv("PAGECRAFT_OIDC_SSO_CLIENT_ID", "pagecraft-client");
  vi.stubEnv("PAGECRAFT_OIDC_SSO_CLIENT_SECRET", "s3cret");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// The provider answers with an ID token made from the claims given, once
// it has checked what the server sent.
function provider(claimsFor: (nonce: string) => Record<string, unknown>) {
  const server = createTestServer({ now: NOW });
  server.pages.set(
    `${ISSUER}/.well-known/openid-configuration`,
    JSON.stringify({
      issuer: ISSUER,
      authorization_endpoint: `${ISSUER}/authorize`,
      token_endpoint: `${ISSUER}/token`,
      jwks_uri: `${ISSUER}/keys`,
    }),
  );
  server.pages.set(
    `${ISSUER}/keys`,
    JSON.stringify({
      keys: [{ ...publicKey.export({ format: "jwk" }), kid: "k1" }],
    }),
  );
  const sent: Record<string, string>[] = [];
  let nonce = "";
  server.forms.set(`${ISSUER}/token`, (fields) => {
    sent.push({ ...fields });
    return JSON.stringify({ id_token: signed(claimsFor(nonce)) });
  });
  const begin = async () => {
    const started = await server.call("GET /api/account/oidc/sso/start");
    const to = new URL(started.location ?? "");
    nonce = to.searchParams.get("nonce") ?? "";
    return { started, to, state: to.searchParams.get("state") ?? "" };
  };
  const finish = (state: string) =>
    server.call(
      `GET /api/account/oidc/callback?code=the-code&state=${encodeURIComponent(state)}`,
    );
  return { server, sent, begin, finish };
}

const good = (nonce: string) => ({
  iss: ISSUER,
  aud: "pagecraft-client",
  exp: NOW / 1000 + 300,
  nonce,
  email: "Grace@Example.com",
  email_verified: true,
  name: "Grace Hopper",
});

describe("signing in through an identity provider", () => {
  it("sends the browser to the provider with a state, a nonce and a proof key", async () => {
    const { begin } = provider(good);

    const { started, to } = await begin();

    expect(started.status).toBe(302);
    expect(to.origin + to.pathname).toBe(`${ISSUER}/authorize`);
    expect(Object.fromEntries(to.searchParams)).toMatchObject({
      response_type: "code",
      client_id: "pagecraft-client",
      redirect_uri: "http://pagecraft.test/api/account/oidc/callback",
      scope: "openid email profile",
      code_challenge_method: "S256",
    });
  });

  it("trades the code for a checked ID token and signs the person in, making the account", async () => {
    const { server, sent, begin, finish } = provider(good);
    const { state } = await begin();

    const back = await finish(state);
    const me = await server.call(
      "GET /api/account/me",
      undefined,
      back.cookies?.[0],
    );

    expect(back).toMatchObject({ status: 302, location: "/" });
    expect(sent[0]).toMatchObject({
      grant_type: "authorization_code",
      code: "the-code",
      client_secret: "s3cret",
    });
    expect(sent[0]?.code_verifier?.length).toBeGreaterThan(40);
    expect(me.body).toMatchObject({
      user: { email: "grace@example.com", name: "Grace Hopper" },
    });
  });

  it.each([
    ["another nonce", (nonce: string) => ({ ...good(nonce), nonce: "x" })],
    ["another audience", (nonce: string) => ({ ...good(nonce), aud: "other" })],
    [
      "another issuer",
      (nonce: string) => ({ ...good(nonce), iss: "https://evil.example" }),
    ],
    [
      "an expired token",
      (nonce: string) => ({ ...good(nonce), exp: NOW / 1000 - 1 }),
    ],
    [
      "an unverified email",
      (nonce: string) => ({ ...good(nonce), email_verified: false }),
    ],
  ])("refuses %s", async (_, claims) => {
    const { begin, finish } = provider(claims);
    const { state } = await begin();

    const back = await finish(state);

    expect(back).toMatchObject({
      status: 302,
      location: "/?signin-error=sso",
    });
    expect(back.cookies).toBeUndefined();
  });

  it("refuses a token signed with another key, and a state used twice", async () => {
    const { server, begin, finish } = provider(good);
    const other = generateKeyPairSync("rsa", { modulusLength: 2048 });
    server.forms.set(`${ISSUER}/token`, () =>
      JSON.stringify({ id_token: signed(good(""), other.privateKey) }),
    );
    const { state } = await begin();

    const forged = await finish(state);
    const again = await finish(state);

    expect(forged.location).toBe("/?signin-error=sso");
    expect(again.location).toBe("/?signin-error=");
  });

  it("lists only the providers this server is set up with", async () => {
    const { server } = provider(good);

    const listed = await server.call("GET /api/account/providers");

    expect(listed.body).toEqual({ providers: ["sso"] });
  });
});
