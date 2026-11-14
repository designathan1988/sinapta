// An ID token's checks (OpenID Connect Core 3.1.3.7): signed with one of
// the provider's keys, by RS256 or ES256; issued by the provider for this
// server; not expired; carrying the nonce this sign-in sent; and naming an
// email the provider has not marked unverified.
import { createPublicKey, verify } from "node:crypto";
import { issuerMatches, type OidcConfig } from "./oidc-config.ts";
import {
  readIdClaims,
  readIdHeader,
  type IdClaims,
  type SigningKey,
} from "./oidc.schema.ts";

export interface TokenExpectation {
  readonly config: OidcConfig;
  readonly nonce: string;
  readonly now: number;
}

function isSigned(token: string, keys: readonly SigningKey[]): boolean {
  const [head, body, signature] = token.split(".");
  const header = readIdHeader(head);
  if (header === undefined || body === undefined || signature === undefined) {
    return false;
  }
  const key = keys.find(
    (each) =>
      (header.kid === undefined || each.kid === header.kid) &&
      each.kty === (header.alg === "RS256" ? "RSA" : "EC"),
  );
  if (key === undefined) return false;
  return verify(
    "sha256",
    Buffer.from(`${String(head)}.${body}`),
    {
      key: createPublicKey({ key, format: "jwk" }),
      ...(header.alg === "ES256" ? { dsaEncoding: "ieee-p1363" as const } : {}),
    },
    Buffer.from(signature, "base64url"),
  );
}

function holds(claims: IdClaims, expected: TokenExpectation): boolean {
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  return (
    issuerMatches(expected.config, claims.iss) &&
    audiences.includes(expected.config.clientId) &&
    claims.exp * 1000 > expected.now &&
    claims.nonce === expected.nonce &&
    claims.email_verified !== false &&
    claims.email_verified !== "false"
  );
}

export function verifyIdToken(
  token: string,
  keys: readonly SigningKey[],
  expected: TokenExpectation,
): IdClaims | undefined {
  if (!isSigned(token, keys)) return undefined;
  const claims = readIdClaims(token.split(".")[1]);
  return claims !== undefined && holds(claims, expected) ? claims : undefined;
}
