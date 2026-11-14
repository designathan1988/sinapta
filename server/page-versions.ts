// Page history on this server, as Notion's: the versions a page's editors
// keep while they edit, read by every member on any device, the 50 newest
// of each page.
import * as v from "valibot";
import { answer, type ApiContext, type RouteTable } from "./api.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import { readVersionRows, versionBodySchema } from "./page-version.schema.ts";
import { sessionUser } from "./sessions.ts";
import { membership } from "./workspaces.ts";

const VERSIONS_PER_PAGE = 50;

interface PageAt {
  readonly workspaceId: string;
  readonly pageId: string;
  readonly userId: string;
}

export function memberPage(
  request: ApiRequest,
  context: ApiContext,
): PageAt | ApiResponse {
  const user = sessionUser(context, request);
  if (user === undefined) return answer(401, { error: "signed-out" });
  const workspace = membership(context, request.params.id ?? "", user.id);
  if (workspace === undefined) return answer(404, { error: "not-found" });
  const pageId = request.params.page ?? "";
  return { workspaceId: workspace.id, pageId, userId: user.id };
}

function listOf(context: ApiContext, at: PageAt) {
  const rows = context.db
    .prepare(
      "SELECT id, taken_at, blocks FROM page_versions WHERE workspace_id = ? AND page_id = ? ORDER BY taken_at DESC",
    )
    .all(at.workspaceId, at.pageId);
  return { versions: readVersionRows(rows) };
}

function keep(request: ApiRequest, context: ApiContext): ApiResponse {
  const at = memberPage(request, context);
  if ("status" in at) return at;
  const parsed = v.safeParse(versionBodySchema, request.body);
  if (!parsed.success) return answer(400, { error: "bad-request" });
  const version = parsed.output;
  const { workspaceId, pageId } = at;
  context.db
    .prepare(
      "INSERT OR REPLACE INTO page_versions (workspace_id, id, page_id, taken_at, blocks, kept_by) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(
      workspaceId,
      version.id,
      pageId,
      version.takenAt,
      JSON.stringify(version.blocks),
      at.userId,
    );
  context.db
    .prepare(
      "DELETE FROM page_versions WHERE workspace_id = ? AND page_id = ? AND id NOT IN (SELECT id FROM page_versions WHERE workspace_id = ? AND page_id = ? ORDER BY taken_at DESC LIMIT ?)",
    )
    .run(workspaceId, pageId, workspaceId, pageId, VERSIONS_PER_PAGE);
  return answer(200, { kept: version.id });
}

export const PAGE_VERSION_ROUTES: RouteTable = {
  "GET /api/workspaces/:id/pages/:page/versions": (request, context) => {
    const at = memberPage(request, context);
    if ("status" in at) return at;
    return answer(200, listOf(context, at));
  },
  "POST /api/workspaces/:id/pages/:page/versions": keep,
};
