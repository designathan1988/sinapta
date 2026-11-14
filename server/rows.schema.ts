// Rows read from SQLite are parsed here, at the database's boundary, as
// JSON is parsed at the client's.
import * as v from "valibot";
import { PLANS } from "../src/model/index.ts";

export const countRowSchema = v.object({ count: v.number() });

export const migrationRowSchema = v.object({ id: v.number() });

export const userRowSchema = v.object({
  id: v.string(),
  email: v.string(),
  name: v.string(),
  photo: v.nullable(v.string()),
  password_hash: v.nullable(v.string()),
  created_at: v.number(),
  last_workspace_id: v.optional(v.nullable(v.string()), null),
});

export type UserRow = v.InferOutput<typeof userRowSchema>;

export const sessionRowSchema = v.object({
  user_id: v.string(),
  expires_at: v.number(),
});

export const codeRowSchema = v.object({
  code_hash: v.string(),
  expires_at: v.number(),
  tries: v.number(),
});

// One row, or undefined when the query found none.
export function readRow<TSchema extends v.GenericSchema>(
  schema: TSchema,
  row: unknown,
): v.InferOutput<TSchema> | undefined {
  return row === undefined ? undefined : v.parse(schema, row);
}

export const workspaceRowSchema = v.object({
  id: v.string(),
  name: v.string(),
  icon: v.nullable(v.string()),
  role: v.string(),
  members: v.number(),
  // 1 when only the workspace's owners may make teamspaces.
  limitsTeamspaces: v.number(),
  plan: v.picklist(PLANS),
});

export type WorkspaceRow = v.InferOutput<typeof workspaceRowSchema>;

export const snapshotRowSchema = v.object({
  seq: v.number(),
  body: v.string(),
});

export const operationRowSchema = v.object({
  seq: v.number(),
  client_id: v.string(),
  body: v.string(),
});

export const lastSeqRowSchema = v.object({ seq: v.nullable(v.number()) });

// Many rows of one schema.
export function readRows<TSchema extends v.GenericSchema>(
  schema: TSchema,
  rows: readonly unknown[],
): v.InferOutput<TSchema>[] {
  return rows.map((row) => v.parse(schema, row));
}

export const idRowSchema = v.object({ id: v.string() });

export const memberRowSchema = v.object({
  id: v.string(),
  name: v.string(),
  email: v.string(),
  role: v.string(),
});

export const inviteRowSchema = v.object({
  email: v.string(),
  role: v.string(),
});

export const pageAccessRowSchema = v.object({
  general: v.picklist(["invited", "workspace", "web"]),
  published: v.number(),
});

export const pageShareRowSchema = v.object({
  email: v.string(),
  access: v.picklist(["full", "edit", "comment", "view"]),
  name: v.nullable(v.string()),
});

export const sharedPageRowSchema = v.object({
  id: v.string(),
  access: v.picklist(["full", "edit", "comment", "view"]),
});

export const generalRowSchema = v.object({
  id: v.string(),
  general: v.picklist(["invited", "workspace", "web"]),
});

export const requestRowSchema = v.object({
  teamspace_id: v.string(),
  user_id: v.string(),
  name: v.string(),
});

export const integrationRowSchema = v.object({
  id: v.string(),
  workspace_id: v.string(),
  name: v.string(),
  created_at: v.number(),
});

export const pageIdRowSchema = v.object({ page_id: v.string() });

export const appConnectionRowSchema = v.object({
  app: v.string(),
  address: v.nullable(v.string()),
});
