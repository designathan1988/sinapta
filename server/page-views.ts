// Page analytics on this server, as Notion's: each opening of a page by a
// member, with who opened it, for every member to read in the page's
// "Updates & analytics" panel; the 5000 newest of each page are kept.
import * as v from "valibot";
import { answer, type ApiContext, type RouteTable } from "./api.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import { memberPage } from "./page-versions.ts";
import { viewBodySchema, viewRowSchema } from "./page-view.schema.ts";
import { readRows } from "./rows.schema.ts";

const VIEWS_PER_PAGE = 5000;

function list(request: ApiRequest, context: ApiContext): ApiResponse {
  const at = memberPage(request, context);
  if ("status" in at) return at;
  const rows = context.db
    .prepare(
      "SELECT page_views.viewed_at, users.name FROM page_views JOIN users ON users.id = page_views.user_id WHERE workspace_id = ? AND page_id = ? ORDER BY viewed_at DESC LIMIT ?",
    )
    .all(at.workspaceId, at.pageId, VIEWS_PER_PAGE);
  const views = readRows(viewRowSchema, rows).map((row) => ({
    viewedAt: row.viewed_at,
    viewer: row.name,
  }));
  return answer(200, { views });
}

function keep(request: ApiRequest, context: ApiContext): ApiResponse {
  const at = memberPage(request, context);
  if ("status" in at) return at;
  const parsed = v.safeParse(viewBodySchema, request.body);
  if (!parsed.success) return answer(400, { error: "bad-request" });
  const { workspaceId, pageId, userId } = at;
  context.db
    .prepare(
      "INSERT INTO page_views (workspace_id, page_id, user_id, viewed_at) VALUES (?, ?, ?, ?)",
    )
    .run(workspaceId, pageId, userId, parsed.output.viewedAt);
  context.db
    .prepare(
      "DELETE FROM page_views WHERE workspace_id = ? AND page_id = ? AND rowid NOT IN (SELECT rowid FROM page_views WHERE workspace_id = ? AND page_id = ? ORDER BY viewed_at DESC LIMIT ?)",
    )
    .run(workspaceId, pageId, workspaceId, pageId, VIEWS_PER_PAGE);
  return answer(200, { kept: true });
}

export const PAGE_VIEW_ROUTES: RouteTable = {
  "GET /api/workspaces/:id/pages/:page/views": list,
  "POST /api/workspaces/:id/pages/:page/views": keep,
};
