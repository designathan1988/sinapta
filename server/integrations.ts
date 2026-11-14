// Integrations, as Notion's internal integrations (ADR-0013): a name and a
// secret a program sends to the public API, and the pages connected to it,
// which with the pages inside them are all it reaches.
import { randomUUID } from "node:crypto";
import type { ApiContext } from "./api.ts";
import * as rows from "./rows.schema.ts";
import { hashSecret, newToken } from "./secrets.ts";

export interface Integration {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: string;
}

// Makes an integration; its secret is shown once and kept only hashed.
export function createIntegration(
  context: ApiContext,
  made: {
    readonly workspaceId: string;
    readonly name: string;
    readonly by: string;
  },
): { readonly id: string; readonly secret: string } {
  const id = randomUUID();
  const secret = `ntn_${newToken()}`;
  context.db
    .prepare(
      "INSERT INTO integrations (id, workspace_id, name, secret_hash, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(
      id,
      made.workspaceId,
      made.name,
      hashSecret(secret),
      made.by,
      context.now(),
    );
  return { id, secret };
}

export function integrationsOf(context: ApiContext, workspaceId: string) {
  const found = context.db
    .prepare(
      "SELECT id, workspace_id, name, created_at FROM integrations WHERE workspace_id = ? ORDER BY created_at",
    )
    .all(workspaceId);
  return rows.readRows(rows.integrationRowSchema, found).map((row) => ({
    id: row.id,
    name: row.name,
    pageIds: connectedPages(context, row.id),
  }));
}

export function removeIntegration(
  context: ApiContext,
  workspaceId: string,
  id: string,
): void {
  context.db
    .prepare("DELETE FROM integrations WHERE id = ? AND workspace_id = ?")
    .run(id, workspaceId);
}

export function connectedPages(context: ApiContext, id: string): string[] {
  const found = context.db
    .prepare("SELECT page_id FROM integration_pages WHERE integration_id = ?")
    .all(id);
  return rows.readRows(rows.pageIdRowSchema, found).map((row) => row.page_id);
}

export function connectPage(
  context: ApiContext,
  link: {
    readonly integrationId: string;
    readonly pageId: string;
    readonly isConnected: boolean;
  },
): void {
  const sql = link.isConnected
    ? "INSERT OR IGNORE INTO integration_pages (integration_id, page_id) VALUES (?, ?)"
    : "DELETE FROM integration_pages WHERE integration_id = ? AND page_id = ?";
  context.db.prepare(sql).run(link.integrationId, link.pageId);
}

// The integration a secret belongs to.
export function integrationOf(
  context: ApiContext,
  secret: string | undefined,
): Integration | undefined {
  if (secret === undefined) return undefined;
  const found = context.db
    .prepare(
      "SELECT id, workspace_id, name, created_at FROM integrations WHERE secret_hash = ?",
    )
    .get(hashSecret(secret));
  const row = rows.readRow(rows.integrationRowSchema, found);
  return row === undefined
    ? undefined
    : { id: row.id, workspaceId: row.workspace_id, name: row.name };
}
