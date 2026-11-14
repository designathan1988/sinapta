// Notion's Share menu on the server, and published pages read by anyone
// with their link (ADR-0013).
import * as v from "valibot";
import {
  parseBlockId,
  SCHEMA_VERSION,
  type BlockId,
} from "../src/model/index.ts";
import { answer, type ApiContext, type RouteTable } from "./api.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import { sessionUser } from "./sessions.ts";
import {
  ACCESS,
  GENERAL,
  publishedPages,
  setGeneral,
  setPublished,
  sharePage,
  sharingOf,
  unsharePage,
  type PageRef,
} from "./sharing.ts";
import { currentWorkspace, pageAlone } from "./workspace-state.ts";
import { membership } from "./workspaces.ts";

const shareSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email()),
  access: v.picklist(ACCESS),
});
const removeSchema = v.object({ email: v.string() });
const generalSchema = v.object({ general: v.picklist(GENERAL) });
const publishSchema = v.object({ published: v.boolean() });

// The page the path names in a workspace the signed-in person belongs to.
function pageOf(
  request: ApiRequest,
  context: ApiContext,
): PageRef | ApiResponse {
  const user = sessionUser(context, request);
  if (user === undefined) return answer(401, { error: "signed-out" });
  const workspace = membership(context, request.params.id ?? "", user.id);
  if (workspace === undefined) return answer(404, { error: "not-found" });
  if (workspace.role === "guest") return answer(403, { error: "guest" });
  return { workspaceId: workspace.id, pageId: request.params.page ?? "" };
}

function isPage(value: PageRef | ApiResponse): value is PageRef {
  return "pageId" in value;
}

const BASE = "/api/workspaces/:id/pages/:page/sharing";

function changing<TSchema extends v.GenericSchema>(
  schema: TSchema,
  change: (
    context: ApiContext,
    page: PageRef,
    body: v.InferOutput<TSchema>,
  ) => void,
) {
  return (request: ApiRequest, context: ApiContext): ApiResponse => {
    const page = pageOf(request, context);
    if (!isPage(page)) return page;
    change(context, page, v.parse(schema, request.body));
    return answer(200, sharingOf(context, page));
  };
}

// The published page with its parent pages up to the one published.
function isPublished(
  context: ApiContext,
  workspaceId: string,
  pageId: BlockId,
) {
  const published = publishedPages(context, workspaceId);
  const workspace = currentWorkspace(context, workspaceId);
  let id: BlockId | null = pageId;
  while (id !== null && workspace !== undefined) {
    if (published.has(id)) return workspace;
    id = workspace.blocks[id]?.parentId ?? null;
  }
  return undefined;
}

export const SHARING_ROUTES: RouteTable = {
  [`GET ${BASE}`]: (request, context) => {
    const page = pageOf(request, context);
    return isPage(page) ? answer(200, sharingOf(context, page)) : page;
  },
  [`POST ${BASE}`]: changing(shareSchema, (context, page, body) => {
    sharePage(context, page, body);
  }),
  [`POST ${BASE}/remove`]: changing(removeSchema, (context, page, body) => {
    unsharePage(context, page, body.email);
  }),
  [`POST ${BASE}/general`]: changing(generalSchema, (context, page, body) => {
    setGeneral(context, page, body.general);
  }),
  [`POST ${BASE}/publish`]: changing(publishSchema, (context, page, body) => {
    setPublished(context, page, body.published);
  }),
  "GET /api/public/:id/:page": (request, context) => {
    const pageId = parseBlockId(request.params.page ?? "");
    const workspaceId = request.params.id ?? "";
    const workspace =
      pageId === undefined
        ? undefined
        : isPublished(context, workspaceId, pageId);
    const alone =
      workspace === undefined || pageId === undefined
        ? undefined
        : pageAlone(workspace, pageId);
    if (alone === undefined) return answer(404, { error: "not-published" });
    return answer(200, { schemaVersion: SCHEMA_VERSION, ...alone });
  },
};
