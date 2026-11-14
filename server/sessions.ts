// Sessions: a random token in an HttpOnly cookie, kept hashed with its
// owner and its end (30 days), renewed at each sign-in.
import type { ApiContext } from "./api.ts";
import type { ApiRequest } from "./http-exchange.ts";
import {
  readRow,
  sessionRowSchema,
  userRowSchema,
  type UserRow,
} from "./rows.schema.ts";
import { hashSecret, newToken } from "./secrets.ts";

export const SESSION_COOKIE = "pagecraft_session";
const SESSION_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

function cookie(context: ApiContext, value: string, maxAge: number): string {
  const secure = context.secure ? "; Secure" : "";
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${String(maxAge)}${secure}`;
}

// Starts a session for a user and answers the cookie that carries it.
export function startSession(context: ApiContext, userId: string): string {
  const token = newToken();
  const expires = context.now() + SESSION_DAYS * DAY;
  context.db
    .prepare(
      "INSERT INTO sessions (id_hash, user_id, expires_at) VALUES (?, ?, ?)",
    )
    .run(hashSecret(token), userId, expires);
  return cookie(context, token, SESSION_DAYS * 24 * 60 * 60);
}

export function endSession(context: ApiContext, request: ApiRequest): string {
  const token = request.cookies.get(SESSION_COOKIE);
  if (token !== undefined) {
    context.db
      .prepare("DELETE FROM sessions WHERE id_hash = ?")
      .run(hashSecret(token));
  }
  return cookie(context, "", 0);
}

// The signed-in user of a request, or undefined.
export function sessionUser(
  context: ApiContext,
  request: ApiRequest,
): UserRow | undefined {
  const token = request.cookies.get(SESSION_COOKIE);
  if (token === undefined) return undefined;
  const session = readRow(
    sessionRowSchema,
    context.db
      .prepare("SELECT user_id, expires_at FROM sessions WHERE id_hash = ?")
      .get(hashSecret(token)),
  );
  if (session === undefined || session.expires_at <= context.now()) {
    return undefined;
  }
  return readRow(
    userRowSchema,
    context.db.prepare("SELECT * FROM users WHERE id = ?").get(session.user_id),
  );
}
