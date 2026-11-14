// The users table: finding, creating and showing an account.
import { randomUUID } from "node:crypto";
import type { ApiContext } from "./api.ts";
import { acceptInvites } from "./members.ts";
import { readRow, userRowSchema, type UserRow } from "./rows.schema.ts";

export interface PublicUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly photo: string | null;
}

export function publicUser(user: UserRow): PublicUser {
  return { id: user.id, email: user.email, name: user.name, photo: user.photo };
}

export function findUser(
  context: ApiContext,
  email: string,
): UserRow | undefined {
  return readRow(
    userRowSchema,
    context.db.prepare("SELECT * FROM users WHERE email = ?").get(email),
  );
}

export interface NewUser {
  readonly email: string;
  readonly name: string;
  readonly passwordHash: string | null;
}

export function createUser(context: ApiContext, user: NewUser): UserRow {
  const row: UserRow = {
    id: randomUUID(),
    email: user.email,
    name: user.name,
    photo: null,
    password_hash: user.passwordHash,
    created_at: context.now(),
    last_workspace_id: null,
  };
  context.db
    .prepare(
      "INSERT INTO users (id, email, name, photo, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(row.id, row.email, row.name, null, row.password_hash, row.created_at);
  acceptInvites(context, row);
  return row;
}

// The name Notion proposes for an account made from a sign-in code: the
// part of the address before the @.
export function nameFromEmail(email: string): string {
  return email.split("@")[0] ?? email;
}

export function renameUser(
  context: ApiContext,
  userId: string,
  name: string,
): void {
  context.db
    .prepare("UPDATE users SET name = ? WHERE id = ?")
    .run(name, userId);
}
