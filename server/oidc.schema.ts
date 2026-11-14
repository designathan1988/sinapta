// What an OpenID Connect provider sends, parsed at the boundary: its
// discovery document, the token answer, its signing keys, and the ID
// token's header and claims.
import * as v from "valibot";

const discoverySchema = v.object({
  issuer: v.string(),
  authorization_endpoint: v.pipe(v.string(), v.url()),
  token_endpoint: v.pipe(v.string(), v.url()),
  jwks_uri: v.pipe(v.string(), v.url()),
});

const tokenSchema = v.object({ id_token: v.string() });

const jwkSchema = v.union([
  v.object({
    kty: v.literal("RSA"),
    kid: v.optional(v.string()),
    n: v.string(),
    e: v.string(),
  }),
  v.object({
    kty: v.literal("EC"),
    kid: v.optional(v.string()),
    crv: v.literal("P-256"),
    x: v.string(),
    y: v.string(),
  }),
]);

// Keys of other kinds, which no ID token here is signed with, are skipped.
const jwksSchema = v.object({
  keys: v.pipe(
    v.array(v.unknown()),
    v.transform((keys) =>
      keys.flatMap((key) => {
        const parsed = v.safeParse(jwkSchema, key);
        return parsed.success ? [parsed.output] : [];
      }),
    ),
  ),
});

const headerSchema = v.object({
  alg: v.picklist(["RS256", "ES256"]),
  kid: v.optional(v.string()),
});

const claimsSchema = v.object({
  iss: v.string(),
  aud: v.union([v.string(), v.array(v.string())]),
  exp: v.number(),
  nonce: v.optional(v.string()),
  email: v.pipe(v.string(), v.email()),
  email_verified: v.optional(v.union([v.boolean(), v.string()])),
  name: v.optional(v.string()),
});

export type Discovery = v.InferOutput<typeof discoverySchema>;
export type IdHeader = v.InferOutput<typeof headerSchema>;
export type IdClaims = v.InferOutput<typeof claimsSchema>;
export type SigningKey = v.InferOutput<typeof jwkSchema>;

function readJson<TSchema extends v.GenericSchema>(
  schema: TSchema,
  text: string | undefined,
): v.InferOutput<TSchema> | undefined {
  if (text === undefined) return undefined;
  try {
    const parsed = v.safeParse(schema, JSON.parse(text));
    return parsed.success ? parsed.output : undefined;
  } catch {
    return undefined;
  }
}

export const readDiscovery = (text: string | undefined) =>
  readJson(discoverySchema, text);
export const readToken = (text: string | undefined) =>
  readJson(tokenSchema, text);
export const readKeys = (text: string | undefined) =>
  readJson(jwksSchema, text)?.keys;

// One part of a JSON Web Token, decoded from base64url.
function part<TSchema extends v.GenericSchema>(
  schema: TSchema,
  text: string | undefined,
): v.InferOutput<TSchema> | undefined {
  if (text === undefined) return undefined;
  return readJson(schema, Buffer.from(text, "base64url").toString("utf8"));
}

export const readIdHeader = (text: string | undefined) =>
  part(headerSchema, text);
export const readIdClaims = (text: string | undefined) =>
  part(claimsSchema, text);
