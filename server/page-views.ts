// Page analytics on this server, as Notion's: each opening of a page by a
// member, with who opened it, for every member to read in the page's
// "Updates & analytics" panel; the 5000 newest of each page are kept. A
// member who does not allow their view history is counted, not named.
import * as v from "valibot";
import { answer, type ApiContext, type RouteTable } from "./api.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import { memberPage } from "./page-versions.ts";
import {
  historyBodySchema,
  viewBodySchema,
  viewRowSchema,
} from "./page-view.schema.ts";
import { countRowSchema, readRow, readRows } from "./rows.schema.ts";
import { sessionUser } from "./sessions.ts";
import { membership } from "./workspaces.ts";

const VIEWS_PER_PAGE = 5000;

function list(request: ApiRequest, context: ApiContext): ApiResponse {
  const at = memberPage(request, context);
  if ("status" in at) return at;
  const rows = context.db
    .prepare(
      "SELECT v.viewed_at, u.name, EXISTS (SELECT 1 FROM view_history_hidden h WHERE h.workspace_id = v.workspace_id AND h.user_id = v.user_id) AS hidden FROM page_views v JOIN users u ON u.id = v.user_id WHERE v.workspace_id = ? AND v.page_id = ? ORDER BY v.viewed_at DESC LIMIT ?",
    )
    .all(at.workspaceId, at.pageId, VIEWS_PER_PAGE);
  const views = readRows(viewRowSchema, rows).map((row) =>
    row.hidden === 0
      ? { viewedAt: row.viewed_at, viewer: row.name }
      : { viewedAt: row.viewed_at, viewer: null, isHidden: true },
  );
  return answer(200, {
    views,
    showsHistory: showsHistory(context, at.workspaceId, at.userId),
  });
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

function showsHistory(
  context: ApiContext,
  workspaceId: string,
  userId: string,
): boolean {
  const row = context.db
    .prepare(
      "SELECT COUNT(*) AS count FROM view_history_hidden WHERE workspace_id = ? AND user_id = ?",
    )
    .get(workspaceId, userId);
  return (readRow(countRowSchema, row)?.count ?? 0) === 0;
}

// "Show your view history": Allow, or Don't allow, for this workspace.
function setHistory(request: ApiRequest, context: ApiContext): ApiResponse {
  const user = sessionUser(context, request);
  if (user === undefined) return answer(401, { error: "signed-out" });
  const workspace = membership(context, request.params.id ?? "", user.id);
  if (workspace === undefined) return answer(404, { error: "not-found" });
  const parsed = v.safeParse(historyBodySchema, request.body);
  if (!parsed.success) return answer(400, { error: "bad-request" });
  const sql = parsed.output.allowed
    ? "DELETE FROM view_history_hidden WHERE workspace_id = ? AND user_id = ?"
    : "INSERT OR IGNORE INTO view_history_hidden (workspace_id, user_id) VALUES (?, ?)";
  context.db.prepare(sql).run(workspace.id, user.id);
  return answer(200, { showsHistory: parsed.output.allowed });
}

export const PAGE_VIEW_ROUTES: RouteTable = {
  "POST /api/workspaces/:id/view-history": setHistory,
  "GET /api/workspaces/:id/pages/:page/views": list,
  "POST /api/workspaces/:id/pages/:page/views": keep,
};
