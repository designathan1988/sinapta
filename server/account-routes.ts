// Notion's sign-in: an email first, then a password, or a code that Notion
// mails and this server prints to its log (ADR-0013). A code for an
// unknown address makes the account, as Notion's does.
import {
  codeSchema,
  lookupSchema,
  parseBody,
  signInSchema,
  signUpSchema,
} from "./account.schema.ts";
import { answer, type ApiContext, type RouteTable } from "./api.ts";
import type { ApiResponse } from "./http-exchange.ts";
import { codeRowSchema, readRow, type UserRow } from "./rows.schema.ts";
import {
  hashPassword,
  hashSecret,
  newCode,
  sameSecret,
  verifyPassword,
} from "./secrets.ts";
import { endSession, sessionUser, startSession } from "./sessions.ts";
import { createUser, findUser, nameFromEmail, publicUser } from "./users.ts";

const CODE_MINUTES = 10;
const CODE_TRIES = 5;

function signedIn(
  context: ApiContext,
  user: UserRow,
  status = 200,
): ApiResponse {
  const cookie = startSession(context, user.id);
  return { status, body: { user: publicUser(user) }, cookies: [cookie] };
}

function sendCode(context: ApiContext, email: string): void {
  const code = newCode();
  context.db
    .prepare(
      "INSERT OR REPLACE INTO login_codes (email, code_hash, expires_at, tries) VALUES (?, ?, ?, 0)",
    )
    .run(email, hashSecret(code), context.now() + CODE_MINUTES * 60_000);
  context.log(`Pagecraft sign-in code for ${email}: ${code}`);
}

// True once, for a code that is right, unexpired and not tried too often.
function takeCode(context: ApiContext, email: string, code: string): boolean {
  const row = readRow(
    codeRowSchema,
    context.db
      .prepare(
        "SELECT code_hash, expires_at, tries FROM login_codes WHERE email = ?",
      )
      .get(email),
  );
  if (row === undefined) return false;
  const valid = row.expires_at > context.now() && row.tries < CODE_TRIES;
  if (valid && sameSecret(code, row.code_hash)) {
    context.db.prepare("DELETE FROM login_codes WHERE email = ?").run(email);
    return true;
  }
  context.db
    .prepare("UPDATE login_codes SET tries = tries + 1 WHERE email = ?")
    .run(email);
  return false;
}

export const ACCOUNT_ROUTES: RouteTable = {
  "POST /api/account/lookup": (request, context) => {
    const { email } = parseBody(lookupSchema, request.body);
    const user = findUser(context, email);
    return answer(200, {
      exists: user !== undefined,
      hasPassword: user?.password_hash !== null && user !== undefined,
    });
  },
  "POST /api/account/sign-up": (request, context) => {
    const body = parseBody(signUpSchema, request.body);
    if (findUser(context, body.email) !== undefined) {
      return answer(409, { error: "email-taken" });
    }
    const passwordHash = hashPassword(body.password);
    return signedIn(
      context,
      createUser(context, { ...body, passwordHash }),
      201,
    );
  },
  "POST /api/account/sign-in": (request, context) => {
    const body = parseBody(signInSchema, request.body);
    const user = findUser(context, body.email);
    const hash = user?.password_hash ?? null;
    if (
      user === undefined ||
      hash === null ||
      !verifyPassword(body.password, hash)
    ) {
      return answer(401, { error: "wrong-password" });
    }
    return signedIn(context, user);
  },
  "POST /api/account/code": (request, context) => {
    sendCode(context, parseBody(lookupSchema, request.body).email);
    return answer(204);
  },
  "POST /api/account/code/verify": (request, context) => {
    const { email, code } = parseBody(codeSchema, request.body);
    if (!takeCode(context, email, code)) {
      return answer(401, { error: "wrong-code" });
    }
    const user =
      findUser(context, email) ??
      createUser(context, {
        email,
        name: nameFromEmail(email),
        passwordHash: null,
      });
    return signedIn(context, user);
  },
  "POST /api/account/sign-out": (request, context) => ({
    status: 204,
    cookies: [endSession(context, request)],
  }),
  "GET /api/account/me": (request, context) => {
    const user = sessionUser(context, request);
    return user === undefined
      ? answer(401, { error: "signed-out" })
      : answer(200, { user: publicUser(user) });
  },
};
