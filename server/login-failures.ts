// Wrong passwords, as a sign-in page that cannot be guessed at without
// end: five for one address within fifteen minutes hold its sign-in back
// until the oldest of them is fifteen minutes old; a right password
// clears them.
import type { ApiContext } from "./api.ts";
import { countRowSchema, readRow } from "./rows.schema.ts";

const WINDOW_MS = 15 * 60_000;
const ALLOWED = 5;

export function isHeldBack(context: ApiContext, email: string): boolean {
  const since = context.now() - WINDOW_MS;
  const row = context.db
    .prepare(
      "SELECT COUNT(*) AS count FROM login_failures WHERE email = ? AND at > ?",
    )
    .get(email, since);
  return (readRow(countRowSchema, row)?.count ?? 0) >= ALLOWED;
}

export function noteFailure(context: ApiContext, email: string): void {
  const now = context.now();
  context.db
    .prepare("DELETE FROM login_failures WHERE email = ? AND at <= ?")
    .run(email, now - WINDOW_MS);
  context.db
    .prepare("INSERT INTO login_failures (email, at) VALUES (?, ?)")
    .run(email, now);
}

export function clearFailures(context: ApiContext, email: string): void {
  context.db.prepare("DELETE FROM login_failures WHERE email = ?").run(email);
}
