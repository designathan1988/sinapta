// Passkeys, as Notion's "Continue with passkey" and My account's passkeys
// (W3C Web Authentication): the server hands out a challenge, the browser's
// authenticator signs it, and the server checks the signature with the
// public key kept when the passkey was added. No third party takes part.
import { randomBytes } from "node:crypto";
import * as v from "valibot";
import { signedIn } from "./account-routes.ts";
import { answer, type ApiContext, type RouteTable } from "./api.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import {
  assertionSchema,
  readClientData,
  readStoredKey,
  registrationSchema,
} from "./passkey.schema.ts";
import {
  challengeRowSchema,
  passkeyRowSchema,
  readRow,
  readRows,
  userRowSchema,
} from "./rows.schema.ts";
import { sessionUser } from "./sessions.ts";
import {
  fromBase64url,
  verifyAssertion,
  verifyRegistration,
} from "./webauthn.ts";

const CHALLENGE_MS = 5 * 60_000;
const optionsSchema = v.object({ purpose: v.picklist(["add", "sign-in"]) });
const removeSchema = v.object({ id: v.string() });
const REFUSED = answer(401, { error: "passkey-refused" });

function newChallenge(context: ApiContext, userId: string | null): string {
  const challenge = randomBytes(32).toString("base64url");
  context.db
    .prepare(
      "INSERT INTO passkey_challenges (challenge, user_id, expires_at) VALUES (?, ?, ?)",
    )
    .run(challenge, userId, context.now() + CHALLENGE_MS);
  return challenge;
}

// A challenge handed out and not yet used: used now, once.
function takeChallenge(context: ApiContext, challenge: string) {
  const row = readRow(
    challengeRowSchema,
    context.db
      .prepare(
        "SELECT user_id, expires_at FROM passkey_challenges WHERE challenge = ?",
      )
      .get(challenge),
  );
  context.db
    .prepare("DELETE FROM passkey_challenges WHERE challenge = ?")
    .run(challenge);
  return row === undefined || row.expires_at < context.now() ? undefined : row;
}

function challengeIn(clientDataJSON: string): string | undefined {
  return readClientData(fromBase64url(clientDataJSON))?.challenge;
}

function listOf(context: ApiContext, userId: string) {
  const rows = readRows(
    passkeyRowSchema,
    context.db
      .prepare("SELECT * FROM passkeys WHERE user_id = ? ORDER BY created_at")
      .all(userId),
  );
  return {
    passkeys: rows.map((row) => ({ id: row.id, createdAt: row.created_at })),
  };
}

function options(request: ApiRequest, context: ApiContext): ApiResponse {
  const { purpose } = v.parse(optionsSchema, request.body);
  const rpId = (request.host ?? "").replace(/:\d+$/, "");
  if (purpose === "sign-in") {
    return answer(200, { challenge: newChallenge(context, null), rpId });
  }
  const user = sessionUser(context, request);
  if (user === undefined) return answer(401, { error: "signed-out" });
  const challenge = newChallenge(context, user.id);
  return answer(200, {
    challenge,
    rpId,
    user: { id: user.id, name: user.email, displayName: user.name },
  });
}

function add(request: ApiRequest, context: ApiContext): ApiResponse {
  const user = sessionUser(context, request);
  if (user === undefined) return answer(401, { error: "signed-out" });
  const body = v.parse(registrationSchema, request.body);
  const challenge = challengeIn(body.clientDataJSON);
  const taken =
    challenge === undefined ? undefined : takeChallenge(context, challenge);
  if (challenge === undefined || taken?.user_id !== user.id) return REFUSED;
  const passkey = verifyRegistration(body, {
    challenge,
    host: request.host ?? "",
  });
  if (passkey === undefined) return REFUSED;
  context.db
    .prepare(
      "INSERT OR REPLACE INTO passkeys (id, user_id, public_key, sign_count, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .run(
      passkey.id,
      user.id,
      JSON.stringify(passkey.publicKey),
      passkey.signCount,
      context.now(),
    );
  return answer(200, listOf(context, user.id));
}

function signIn(request: ApiRequest, context: ApiContext): ApiResponse {
  const body = v.parse(assertionSchema, request.body);
  const challenge = challengeIn(body.clientDataJSON);
  if (
    challenge === undefined ||
    takeChallenge(context, challenge) === undefined
  ) {
    return REFUSED;
  }
  const stored = readRow(
    passkeyRowSchema,
    context.db.prepare("SELECT * FROM passkeys WHERE id = ?").get(body.id),
  );
  if (stored === undefined) return REFUSED;
  const publicKey = readStoredKey(stored.public_key);
  const count =
    publicKey === undefined
      ? undefined
      : verifyAssertion(
          body,
          { publicKey, signCount: stored.sign_count },
          {
            challenge,
            host: request.host ?? "",
          },
        );
  if (count === undefined) return REFUSED;
  context.db
    .prepare("UPDATE passkeys SET sign_count = ? WHERE id = ?")
    .run(count, stored.id);
  const user = readRow(
    userRowSchema,
    context.db.prepare("SELECT * FROM users WHERE id = ?").get(stored.user_id),
  );
  return user === undefined ? REFUSED : signedIn(context, user);
}

export const PASSKEY_ROUTES: RouteTable = {
  "POST /api/account/passkey/options": options,
  "POST /api/account/passkey/add": add,
  "POST /api/account/passkey/sign-in": signIn,
  "GET /api/account/passkeys": (request, context) => {
    const user = sessionUser(context, request);
    if (user === undefined) return answer(401, { error: "signed-out" });
    return answer(200, listOf(context, user.id));
  },
  "POST /api/account/passkeys/remove": (request, context) => {
    const user = sessionUser(context, request);
    if (user === undefined) return answer(401, { error: "signed-out" });
    const { id } = v.parse(removeSchema, request.body);
    context.db
      .prepare("DELETE FROM passkeys WHERE id = ? AND user_id = ?")
      .run(id, user.id);
    return answer(200, listOf(context, user.id));
  },
};
