// The server's answers about passkeys, parsed at the boundary: the
// challenge to sign (with, for a new passkey, whose it is), and the list.
import * as v from "valibot";

const base64url = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]+$/));

const optionsSchema = v.object({
  challenge: base64url,
  rpId: v.string(),
  user: v.optional(
    v.object({ id: v.string(), name: v.string(), displayName: v.string() }),
  ),
});

const listSchema = v.object({
  passkeys: v.array(v.object({ id: v.string(), createdAt: v.number() })),
});

export function readPasskeyOptions(value: unknown) {
  const parsed = v.safeParse(optionsSchema, value);
  return parsed.success ? parsed.output : undefined;
}

export function readPasskeys(value: unknown) {
  const parsed = v.safeParse(listSchema, value);
  return parsed.success ? parsed.output.passkeys : undefined;
}
