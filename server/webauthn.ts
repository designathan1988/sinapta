// A passkey's checks (W3C Web Authentication, level 2), with node:crypto
// alone: what the browser signed must name this server's challenge, its
// origin and its host; a new passkey's public key is read from its
// attestation (format "none"); a sign-in's signature is verified with it.
import { createHash, verify, type JsonWebKey } from "node:crypto";
import { decodeCbor, type CborValue } from "./cbor.ts";
import { readClientData } from "./passkey.schema.ts";

export interface Expected {
  readonly challenge: string;
  // The host the page was served from, "localhost:5190".
  readonly host: string;
}

const USER_PRESENT = 0x01;
const HAS_CREDENTIAL = 0x40;

const sha256 = (bytes: Uint8Array): Buffer =>
  createHash("sha256").update(bytes).digest();

export const fromBase64url = (text: string): Uint8Array =>
  new Uint8Array(Buffer.from(text, "base64url"));

function rpIdOf(host: string): string {
  return host.replace(/:\d+$/, "");
}

// The client data, when it is of the right kind and names what is expected.
function checkClientData(
  bytes: Uint8Array,
  type: "webauthn.create" | "webauthn.get",
  expected: Expected,
): boolean {
  const data = readClientData(bytes);
  return (
    data?.type === type &&
    data.challenge === expected.challenge &&
    new URL(data.origin).host === expected.host
  );
}

interface AuthData {
  readonly signCount: number;
  readonly credential?: { readonly id: Uint8Array; readonly key: CborValue };
}

function readAuthData(bytes: Uint8Array, host: string): AuthData | undefined {
  if (bytes.length < 37) return undefined;
  const rpIdHash = sha256(new TextEncoder().encode(rpIdOf(host)));
  if (!rpIdHash.equals(bytes.subarray(0, 32))) return undefined;
  const flags = bytes[32] ?? 0;
  if ((flags & USER_PRESENT) === 0) return undefined;
  const signCount = Buffer.from(bytes.subarray(33, 37)).readUInt32BE(0);
  if ((flags & HAS_CREDENTIAL) === 0) return { signCount };
  const length = Buffer.from(bytes.subarray(53, 55)).readUInt16BE(0);
  const id = bytes.slice(55, 55 + length);
  const key = decodeCbor(bytes.subarray(55 + length)).value;
  return { signCount, credential: { id, key } };
}

// A COSE EC2 key on P-256 (ES256, the only one asked for) as a JWK.
function jwkOf(key: CborValue): JsonWebKey | undefined {
  if (!(key instanceof Map)) return undefined;
  const x: unknown = key.get(-2);
  const y: unknown = key.get(-3);
  const isEs256 = key.get(1) === 2 && key.get(3) === -7 && key.get(-1) === 1;
  if (!isEs256 || !(x instanceof Uint8Array) || !(y instanceof Uint8Array)) {
    return undefined;
  }
  return {
    kty: "EC",
    crv: "P-256",
    x: Buffer.from(x).toString("base64url"),
    y: Buffer.from(y).toString("base64url"),
  };
}

export interface NewPasskey {
  readonly id: string;
  readonly publicKey: JsonWebKey;
  readonly signCount: number;
}

export function verifyRegistration(
  body: { readonly clientDataJSON: string; readonly attestationObject: string },
  expected: Expected,
): NewPasskey | undefined {
  const clientData = fromBase64url(body.clientDataJSON);
  if (!checkClientData(clientData, "webauthn.create", expected)) {
    return undefined;
  }
  const attestation = decodeCbor(fromBase64url(body.attestationObject)).value;
  const authData: unknown =
    attestation instanceof Map ? attestation.get("authData") : undefined;
  if (!(authData instanceof Uint8Array)) return undefined;
  const read = readAuthData(authData, expected.host);
  const publicKey =
    read?.credential === undefined ? undefined : jwkOf(read.credential.key);
  if (read?.credential === undefined || publicKey === undefined) {
    return undefined;
  }
  return {
    id: Buffer.from(read.credential.id).toString("base64url"),
    publicKey,
    signCount: read.signCount,
  };
}

// The new sign count when the signature holds, else nothing. A count that
// does not grow (when the authenticator keeps one) means a copied key.
export function verifyAssertion(
  body: {
    readonly clientDataJSON: string;
    readonly authenticatorData: string;
    readonly signature: string;
  },
  stored: { readonly publicKey: JsonWebKey; readonly signCount: number },
  expected: Expected,
): number | undefined {
  const clientData = fromBase64url(body.clientDataJSON);
  if (!checkClientData(clientData, "webauthn.get", expected)) return undefined;
  const authData = fromBase64url(body.authenticatorData);
  const read = readAuthData(authData, expected.host);
  if (read === undefined) return undefined;
  const signed = Buffer.concat([authData, sha256(clientData)]);
  const isValid = verify(
    "sha256",
    signed,
    { key: stored.publicKey, format: "jwk", dsaEncoding: "der" },
    fromBase64url(body.signature),
  );
  const isFresh = read.signCount === 0 || read.signCount > stored.signCount;
  return isValid && isFresh ? read.signCount : undefined;
}
