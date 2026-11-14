// Passkeys through the browser (W3C Web Authentication): the server's
// challenge goes to the device's authenticator, which signs it after the
// person confirms (a fingerprint, a face, a PIN), and the signature goes
// back to the server. "Continue with passkey" and My account's "Add a
// passkey".
import type { AccountAnswer } from "../state/index.ts";
import type { Fetch } from "./account-client.ts";
import { parseReply, readUser } from "./account.schema.ts";
import { readPasskeyCount, readPasskeyOptions } from "./passkey.schema.ts";

const REFUSED: AccountAnswer = { kind: "error", error: "passkey-refused" };

async function json(
  send: Fetch,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  const response = await send(path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: parseReply(await response.text()) };
}

const bytesOf = (text: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (char) =>
    char.charCodeAt(0),
  );

const textOf = (buffer: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

async function signIn(send: Fetch): Promise<AccountAnswer> {
  const offered = await json(send, "/api/account/passkey/options", {
    purpose: "sign-in",
  });
  const options = readPasskeyOptions(offered.body);
  if (options === undefined) return REFUSED;
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: bytesOf(options.challenge),
      rpId: options.rpId,
      userVerification: "preferred",
    },
  });
  if (!(credential instanceof PublicKeyCredential)) return REFUSED;
  const { response } = credential;
  if (!(response instanceof AuthenticatorAssertionResponse)) return REFUSED;
  const reply = await json(send, "/api/account/passkey/sign-in", {
    id: credential.id,
    clientDataJSON: textOf(response.clientDataJSON),
    authenticatorData: textOf(response.authenticatorData),
    signature: textOf(response.signature),
  });
  const user = readUser(reply.body);
  return user === undefined ? REFUSED : { kind: "user", user };
}

async function add(send: Fetch): Promise<AccountAnswer> {
  const offered = await json(send, "/api/account/passkey/options", {
    purpose: "add",
  });
  const options = readPasskeyOptions(offered.body);
  if (options?.user === undefined) return REFUSED;
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: bytesOf(options.challenge),
      rp: { name: "Pagecraft", id: options.rpId },
      user: {
        id: new TextEncoder().encode(options.user.id),
        name: options.user.name,
        displayName: options.user.displayName,
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "preferred",
      },
      attestation: "none",
    },
  });
  if (!(credential instanceof PublicKeyCredential)) return REFUSED;
  const { response } = credential;
  if (!(response instanceof AuthenticatorAttestationResponse)) return REFUSED;
  const reply = await json(send, "/api/account/passkey/add", {
    id: credential.id,
    clientDataJSON: textOf(response.clientDataJSON),
    attestationObject: textOf(response.attestationObject),
  });
  const count = readPasskeyCount(reply.body);
  return count === undefined ? REFUSED : { kind: "passkeys", count };
}

async function count(send: Fetch): Promise<AccountAnswer> {
  const reply = await json(send, "/api/account/passkeys");
  const found = readPasskeyCount(reply.body);
  return found === undefined
    ? { kind: "passkeys", count: 0 }
    : { kind: "passkeys", count: found };
}

// A passkey request; a person who cancels the device's prompt is told the
// passkey was not used.
export async function askPasskey(
  send: Fetch,
  kind: "passkey-sign-in" | "passkey-add" | "passkeys",
): Promise<AccountAnswer> {
  try {
    if (kind === "passkeys") return await count(send);
    return kind === "passkey-add" ? await add(send) : await signIn(send);
  } catch {
    return REFUSED;
  }
}
