// What a browser sends for a passkey, parsed at the boundary: the request
// bodies, and the client data the authenticator signed over.
import * as v from "valibot";

const base64url = v.pipe(
  v.string(),
  v.regex(/^[A-Za-z0-9_-]+$/),
  v.maxLength(8192),
);

export const registrationSchema = v.object({
  id: base64url,
  clientDataJSON: base64url,
  attestationObject: base64url,
});

export const assertionSchema = v.object({
  id: base64url,
  clientDataJSON: base64url,
  authenticatorData: base64url,
  signature: base64url,
});

const clientDataSchema = v.object({
  type: v.picklist(["webauthn.create", "webauthn.get"]),
  challenge: base64url,
  origin: v.pipe(v.string(), v.url()),
});

export type ClientData = v.InferOutput<typeof clientDataSchema>;

// The client data's JSON, as the authenticator signed it, or nothing.
export function readClientData(bytes: Uint8Array): ClientData | undefined {
  try {
    const parsed = v.safeParse(
      clientDataSchema,
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    return parsed.success ? parsed.output : undefined;
  } catch {
    return undefined;
  }
}

const storedKeySchema = v.object({
  kty: v.literal("EC"),
  crv: v.literal("P-256"),
  x: base64url,
  y: base64url,
});

// A passkey's public key as the database keeps it, or nothing.
export function readStoredKey(
  text: string,
): v.InferOutput<typeof storedKeySchema> | undefined {
  try {
    const parsed = v.safeParse(storedKeySchema, JSON.parse(text));
    return parsed.success ? parsed.output : undefined;
  } catch {
    return undefined;
  }
}
