// A page's sharing (ADR-0013), as Notion's Share menu: the people invited
// to it with their access, who else can open it ("General access"), and
// whether it is published to the web.
import type { ApiContext } from "./api.ts";
import { invite } from "./members.ts";
import * as rows from "./rows.schema.ts";

export const ACCESS = ["full", "edit", "comment", "view"] as const;
export type Access = (typeof ACCESS)[number];
export const GENERAL = ["invited", "workspace", "web"] as const;
export type General = (typeof GENERAL)[number];

export interface PageRef {
  readonly workspaceId: string;
  readonly pageId: string;
}

export function sharingOf(context: ApiContext, page: PageRef) {
  const settings = rows.readRow(
    rows.pageAccessRowSchema,
    context.db
      .prepare(
        "SELECT general, published FROM page_access WHERE workspace_id = ? AND page_id = ?",
      )
      .get(page.workspaceId, page.pageId),
  );
  const people = context.db
    .prepare(
      "SELECT s.email, s.access, u.name FROM page_shares s LEFT JOIN users u ON u.email = s.email WHERE s.workspace_id = ? AND s.page_id = ? ORDER BY s.email",
    )
    .all(page.workspaceId, page.pageId);
  return {
    general: settings?.general ?? "workspace",
    published: settings?.published === 1,
    people: rows.readRows(rows.pageShareRowSchema, people),
  };
}

function ensureRow(context: ApiContext, page: PageRef): void {
  context.db
    .prepare(
      "INSERT OR IGNORE INTO page_access (workspace_id, page_id) VALUES (?, ?)",
    )
    .run(page.workspaceId, page.pageId);
}

// Invites a person to the page; one outside the workspace becomes its
// guest, as in Notion.
export function sharePage(
  context: ApiContext,
  page: PageRef,
  person: { readonly email: string; readonly access: Access },
): void {
  context.db
    .prepare(
      "INSERT OR REPLACE INTO page_shares (workspace_id, page_id, email, access) VALUES (?, ?, ?, ?)",
    )
    .run(page.workspaceId, page.pageId, person.email, person.access);
  invite(context, page.workspaceId, { email: person.email, role: "guest" });
}

export function unsharePage(
  context: ApiContext,
  page: PageRef,
  email: string,
): void {
  context.db
    .prepare(
      "DELETE FROM page_shares WHERE workspace_id = ? AND page_id = ? AND email = ?",
    )
    .run(page.workspaceId, page.pageId, email);
}

export function setGeneral(
  context: ApiContext,
  page: PageRef,
  general: General,
): void {
  ensureRow(context, page);
  context.db
    .prepare(
      "UPDATE page_access SET general = ? WHERE workspace_id = ? AND page_id = ?",
    )
    .run(general, page.workspaceId, page.pageId);
}

export function setPublished(
  context: ApiContext,
  page: PageRef,
  published: boolean,
): void {
  ensureRow(context, page);
  context.db
    .prepare(
      "UPDATE page_access SET published = ? WHERE workspace_id = ? AND page_id = ?",
    )
    .run(published ? 1 : 0, page.workspaceId, page.pageId);
}

// The pages of a workspace published to the web.
export function publishedPages(
  context: ApiContext,
  workspaceId: string,
): ReadonlySet<string> {
  const found = context.db
    .prepare(
      "SELECT page_id AS id FROM page_access WHERE workspace_id = ? AND published = 1",
    )
    .all(workspaceId);
  return new Set(rows.readRows(rows.idRowSchema, found).map((row) => row.id));
}
