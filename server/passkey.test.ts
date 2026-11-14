import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createTestServer } from "./test-context.ts";

// A software authenticator: what a phone or a laptop's passkey does, with a
// P-256 key made for the test and CBOR written by hand.
type Cbor = number | string | Uint8Array | Map<Cbor, Cbor>;

function head(major: number, value: number): number[] {
  if (value < 24) return [(major << 5) | value];
  if (value < 256) return [(major << 5) | 24, value];
  return [(major << 5) | 25, value >> 8, value & 255];
}

function cbor(value: Cbor): number[] {
  if (typeof value === "number") {
    return value >= 0 ? head(0, value) : head(1, -1 - value);
  }
  if (typeof value === "string") {
    const bytes = [...new TextEncoder().encode(value)];
    return [...head(3, bytes.length), ...bytes];
  }
  if (value instanceof Uint8Array) return [...head(2, value.length), ...value];
  return [
    ...head(5, value.size),
    ...[...value].flatMap(([key, item]) => [...cbor(key), ...cbor(item)]),
  ];
}

const sha256 = (bytes: Uint8Array) =>
  new Uint8Array(createHash("sha256").update(bytes).digest());
const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64url");
const RP = "pagecraft.test";

function authenticator() {
  const { publicKey, privateKey } = generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  });
  const jwk = publicKey.export({ format: "jwk" });
  const credentialId = new Uint8Array([7, 7, 7, 7]);
  let count = 0;
  const authData = (withKey: boolean) => {
    count += 1;
    const cose = new Map<Cbor, Cbor>([
      [1, 2],
      [3, -7],
      [-1, 1],
      [-2, new Uint8Array(Buffer.from(jwk.x ?? "", "base64url"))],
      [-3, new Uint8Array(Buffer.from(jwk.y ?? "", "base64url"))],
    ]);
    const attested = withKey
      ? [
          ...new Uint8Array(16),
          0,
          credentialId.length,
          ...credentialId,
          ...cbor(cose),
        ]
      : [];
    return new Uint8Array([
      ...sha256(new TextEncoder().encode(RP)),
      withKey ? 0x45 : 0x05,
      0,
      0,
      0,
      count,
      ...attested,
    ]);
  };
  const clientData = (type: string, challenge: string, origin: string) =>
    new TextEncoder().encode(JSON.stringify({ type, challenge, origin }));
  return {
    create: (challenge: string) => {
      const attestation = new Map<Cbor, Cbor>([
        ["fmt", "none"],
        ["attStmt", new Map()],
        ["authData", authData(true)],
      ]);
      return {
        id: b64(credentialId),
        clientDataJSON: b64(
          clientData("webauthn.create", challenge, `http://${RP}`),
        ),
        attestationObject: b64(new Uint8Array(cbor(attestation))),
      };
    },
    get: (challenge: string, origin = `http://${RP}`) => {
      const data = clientData("webauthn.get", challenge, origin);
      const auth = authData(false);
      const signature = sign(
        "sha256",
        Buffer.concat([auth, sha256(data)]),
        privateKey,
      );
      return {
        id: b64(credentialId),
        clientDataJSON: b64(data),
        authenticatorData: b64(auth),
        signature: b64(new Uint8Array(signature)),
      };
    },
  };
}

function challengeOf(body: unknown): string {
  const value =
    typeof body === "object" && body !== null && "challenge" in body
      ? body.challenge
      : undefined;
  if (typeof value !== "string") throw new Error("no challenge");
  return value;
}

async function withPasskey() {
  const server = createTestServer();
  const signUp = await server.call("POST /api/account/sign-up", {
    email: "ada@pagecraft.test",
    password: "long enough",
    name: "Ada",
  });
  const cookie = signUp.cookies?.[0];
  const key = authenticator();
  const offered = await server.call(
    "POST /api/account/passkey/options",
    { purpose: "add" },
    cookie,
  );
  const added = await server.call(
    "POST /api/account/passkey/add",
    key.create(challengeOf(offered.body)),
    cookie,
  );
  const signInChallenge = async () =>
    challengeOf(
      (
        await server.call("POST /api/account/passkey/options", {
          purpose: "sign-in",
        })
      ).body,
    );
  return { server, key, added, signInChallenge };
}

describe("passkeys", () => {
  it("adds a passkey to the account, then signs in with it alone", async () => {
    const { server, key, added, signInChallenge } = await withPasskey();

    const signedIn = await server.call(
      "POST /api/account/passkey/sign-in",
      key.get(await signInChallenge()),
    );
    const me = await server.call(
      "GET /api/account/me",
      undefined,
      signedIn.cookies?.[0],
    );

    expect(added.body).toMatchObject({ passkeys: [{ id: "BwcHBw" }] });
    expect(signedIn.status).toBe(200);
    expect(me.body).toMatchObject({ user: { name: "Ada" } });
  });

  it("refuses a challenge used twice", async () => {
    const { server, key, signInChallenge } = await withPasskey();
    const challenge = await signInChallenge();

    await server.call("POST /api/account/passkey/sign-in", key.get(challenge));
    const again = await server.call(
      "POST /api/account/passkey/sign-in",
      key.get(challenge),
    );

    expect(again.status).toBe(401);
  });

  it("refuses a signature made for another site", async () => {
    const { server, key, signInChallenge } = await withPasskey();

    const elsewhere = await server.call(
      "POST /api/account/passkey/sign-in",
      key.get(await signInChallenge(), "https://pagecraft.example"),
    );

    expect(elsewhere.status).toBe(401);
  });

  it("refuses another key's signature", async () => {
    const { server, signInChallenge } = await withPasskey();
    const stranger = authenticator();

    const forged = await server.call(
      "POST /api/account/passkey/sign-in",
      stranger.get(await signInChallenge()),
    );

    expect(forged.status).toBe(401);
  });
});
