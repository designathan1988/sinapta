// The workspace tables: members, the snapshot, and the log of operations
// in the order the server received them (ADR-0013).
import { randomUUID } from "node:crypto";
import type { Operation } from "../src/model/index.ts";
import type { ApiContext } from "./api.ts";
import { inTransaction } from "./database.ts";
import {
  lastSeqRowSchema,
  operationRowSchema,
  readRow,
  readRows,
  snapshotRowSchema,
  workspaceRowSchema,
  type WorkspaceRow,
} from "./rows.schema.ts";

export interface LoggedOperations {
  readonly seq: number;
  readonly clientId: string;
  readonly operations: unknown;
}

const WORKSPACE_COLUMNS =
  "SELECT w.id, w.name, w.icon, m.role, (SELECT COUNT(*) FROM members c WHERE c.workspace_id = w.id) AS members, w.limits_teamspaces AS limitsTeamspaces, w.plan FROM workspaces w JOIN members m ON m.workspace_id = w.id";

export function workspacesOf(
  context: ApiContext,
  userId: string,
): WorkspaceRow[] {
  const rows = context.db
    .prepare(`${WORKSPACE_COLUMNS} WHERE m.user_id = ? ORDER BY w.created_at`)
    .all(userId);
  return readRows(workspaceRowSchema, rows);
}

export function membership(
  context: ApiContext,
  workspaceId: string,
  userId: string,
): WorkspaceRow | undefined {
  const row = context.db
    .prepare(`${WORKSPACE_COLUMNS} WHERE w.id = ? AND m.user_id = ?`)
    .get(workspaceId, userId);
  return readRow(workspaceRowSchema, row);
}

export interface NewWorkspace {
  readonly ownerId: string;
  readonly name: string;
  readonly snapshot: unknown;
}

export function createWorkspace(
  context: ApiContext,
  workspace: NewWorkspace,
): WorkspaceRow {
  const id = randomUUID();
  const { db } = context;
  inTransaction(db, () => {
    db.prepare(
      "INSERT INTO workspaces (id, name, icon, created_at) VALUES (?, ?, NULL, ?)",
    ).run(id, workspace.name, context.now());
    db.prepare(
      "INSERT INTO members (workspace_id, user_id, role) VALUES (?, ?, 'owner')",
    ).run(id, workspace.ownerId);
    db.prepare(
      "INSERT INTO snapshots (workspace_id, seq, body) VALUES (?, 0, ?)",
    ).run(id, JSON.stringify(workspace.snapshot));
  });
  markOpened(context, workspace.ownerId, id);
  return {
    id,
    name: workspace.name,
    icon: null,
    role: "owner",
    members: 1,
    limitsTeamspaces: 0,
    plan: "free",
  };
}

function parsed(text: string): unknown {
  const value: unknown = JSON.parse(text);
  return value;
}

export function snapshotOf(
  context: ApiContext,
  workspaceId: string,
): { readonly seq: number; readonly snapshot: unknown } | undefined {
  const row = readRow(
    snapshotRowSchema,
    context.db
      .prepare("SELECT seq, body FROM snapshots WHERE workspace_id = ?")
      .get(workspaceId),
  );
  return row === undefined
    ? undefined
    : { seq: row.seq, snapshot: parsed(row.body) };
}

export function operationsAfter(
  context: ApiContext,
  workspaceId: string,
  after: number,
): LoggedOperations[] {
  const rows = context.db
    .prepare(
      "SELECT seq, client_id, body FROM operations WHERE workspace_id = ? AND seq > ? ORDER BY seq",
    )
    .all(workspaceId, after);
  return readRows(operationRowSchema, rows).map((row) => ({
    seq: row.seq,
    clientId: row.client_id,
    operations: parsed(row.body),
  }));
}

export interface Logged {
  readonly workspaceId: string;
  readonly userId: string;
  readonly clientId: string;
  readonly operations: readonly Operation[];
}

// Appends one client's transaction with the next sequence number.
export function logOperations(context: ApiContext, entry: Logged): number {
  const { db } = context;
  return inTransaction(db, () => {
    const last = readRow(
      lastSeqRowSchema,
      db
        .prepare(
          "SELECT MAX(seq) AS seq FROM operations WHERE workspace_id = ?",
        )
        .get(entry.workspaceId),
    );
    const seq = (last?.seq ?? 0) + 1;
    db.prepare(
      "INSERT INTO operations (workspace_id, seq, client_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(
      entry.workspaceId,
      seq,
      entry.clientId,
      entry.userId,
      JSON.stringify(entry.operations),
      context.now(),
    );
    return seq;
  });
}

// The workspace a person opened last, opened again at the next sign-in.
export function markOpened(
  context: ApiContext,
  userId: string,
  workspaceId: string,
): void {
  context.db
    .prepare("UPDATE users SET last_workspace_id = ? WHERE id = ?")
    .run(workspaceId, userId);
}
