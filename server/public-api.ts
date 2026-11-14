// The public API (ADR-0013), as Notion's REST API at /v1: an integration
// sends its secret as a bearer token and reaches the pages connected to
// it and the pages inside them; it reads and searches them, makes pages
// and appends blocks, which every client receives as they happen.
import * as v from "valibot";
import {
  parseBlockId,
  type Block,
  type Operation,
  type Workspace,
} from "../src/model/index.ts";
import { answer, type ApiContext, type RouteTable } from "./api.ts";
import { reachOf, type Reach } from "./guest-access.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import {
  connectedPages,
  integrationOf,
  type Integration,
} from "./integrations.ts";
import { blockOut, pageOut, plainOf } from "./notion-format.ts";
import * as input from "./notion-input.schema.ts";
import * as changes from "./public-api-changes.ts";
import { logServerChange } from "./server-change.ts";
import { currentWorkspace } from "./workspace-state.ts";

interface Caller {
  readonly integration: Integration;
  readonly workspace: Workspace;
  readonly reach: Reach;
}

const fail = (status: number, code: string, message: string) =>
  answer(status, { object: "error", status, code, message });

const NOT_FOUND = fail(
  404,
  "object_not_found",
  "Could not find the object, or it is not shared with this integration.",
);

function callerOf(
  request: ApiRequest,
  context: ApiContext,
): Caller | ApiResponse {
  const integration = integrationOf(context, request.bearer);
  if (integration === undefined) {
    return fail(401, "unauthorized", "API token is invalid.");
  }
  const workspace = currentWorkspace(context, integration.workspaceId);
  if (workspace === undefined) return NOT_FOUND;
  const pages = connectedPages(context, integration.id);
  const reach = reachOf(workspace, new Map(pages.map((id) => [id, "full"])));
  return { integration, workspace, reach };
}

const isCaller = (value: Caller | ApiResponse): value is Caller =>
  "reach" in value;

// A block the integration reaches, by the id in the path.
function reached(caller: Caller, id: string | undefined): Block | undefined {
  const blockId = parseBlockId(id ?? "");
  if (blockId === undefined || !caller.reach.has(blockId)) return undefined;
  return caller.workspace.blocks[blockId];
}

const list = (results: readonly unknown[]) => ({
  object: "list",
  results,
  next_cursor: null,
  has_more: false,
});

const isPageLike = (block: Block) =>
  block.type === "page" || block.type === "database";

function save(context: ApiContext, caller: Caller, operations: Operation[]) {
  logServerChange(
    context,
    {
      workspaceId: caller.integration.workspaceId,
      by: caller.integration.id,
      clientId: `integration-${caller.integration.id}`,
    },
    operations,
  );
}

function by(caller: Caller) {
  const { id, name } = caller.integration;
  return { author: { id, name }, now: new Date().toISOString() };
}

type CallerRoute = (
  caller: Caller,
  request: ApiRequest,
  context: ApiContext,
) => ApiResponse;

// Every /v1 route: the caller first, then the route; a malformed body is
// Notion's validation_error.
function withCaller(route: CallerRoute) {
  return (request: ApiRequest, context: ApiContext): ApiResponse => {
    const caller = callerOf(request, context);
    if (!isCaller(caller)) return caller;
    try {
      return route(caller, request, context);
    } catch (error) {
      if (error instanceof Error && error.name === "ValiError") {
        return fail(400, "validation_error", error.message);
      }
      throw error;
    }
  };
}

function search(caller: Caller, request: ApiRequest): ApiResponse {
  const { query } = v.parse(input.searchSchema, request.body ?? {});
  const words = query.toLowerCase();
  const results = [...caller.reach.keys()].flatMap((id) => {
    const block = reached(caller, id);
    if (block === undefined || !isPageLike(block)) return [];
    return plainOf(block.props.title).toLowerCase().includes(words)
      ? [pageOut(block, caller.workspace)]
      : [];
  });
  return answer(200, list(results));
}

function children(caller: Caller, request: ApiRequest): ApiResponse {
  const block = reached(caller, request.params.block);
  if (block === undefined) return NOT_FOUND;
  const found = block.childIds.flatMap((id) => {
    const child = caller.workspace.blocks[id];
    return child === undefined ? [] : [blockOut(child)];
  });
  return answer(200, list(found));
}

function queryRows(caller: Caller, request: ApiRequest): ApiResponse {
  const database = reached(caller, request.params.database);
  if (database?.type !== "database") return NOT_FOUND;
  const rows = database.childIds.flatMap((id) => {
    const row = caller.workspace.blocks[id];
    return row === undefined || row.props.isTrashed === true
      ? []
      : [pageOut(row, caller.workspace)];
  });
  return answer(200, list(rows));
}

function appendBlocks(
  caller: Caller,
  request: ApiRequest,
  context: ApiContext,
): ApiResponse {
  const parent = reached(caller, request.params.block);
  if (parent === undefined) return NOT_FOUND;
  const body = v.parse(input.appendSchema, request.body);
  const made = changes.appended(parent, body.children, by(caller));
  save(context, caller, made.operations);
  return answer(200, list(made.blocks.map(blockOut)));
}

function createPage(
  caller: Caller,
  request: ApiRequest,
  context: ApiContext,
): ApiResponse {
  const body = v.parse(input.createPageSchema, request.body);
  const parentId =
    "page_id" in body.parent ? body.parent.page_id : body.parent.database_id;
  const parent = reached(caller, parentId);
  if (parent === undefined || !isPageLike(parent)) return NOT_FOUND;
  const page = changes.newPage(parent, body.properties, by(caller));
  const filled = changes.appended(page, body.children, by(caller));
  save(context, caller, [
    ...changes.pageCreation(parent, page),
    ...filled.operations,
  ]);
  return answer(200, pageOut(page, caller.workspace));
}

function updatePage(
  caller: Caller,
  request: ApiRequest,
  context: ApiContext,
): ApiResponse {
  const page = reached(caller, request.params.page);
  if (page === undefined || !isPageLike(page)) return NOT_FOUND;
  const body = v.parse(input.updatePageSchema, request.body);
  const isTrashed = body.in_trash ?? body.archived;
  const title =
    body.properties === undefined ? undefined : input.titleIn(body.properties);
  const change = {
    ...(title !== undefined && { title }),
    ...(isTrashed !== undefined && { isTrashed }),
  };
  const operation = changes.pageUpdate(page, change, by(caller));
  save(context, caller, [operation]);
  const updated = { ...page, props: { ...page.props, ...change } };
  return answer(200, pageOut(updated, caller.workspace));
}

function readPage(caller: Caller, request: ApiRequest): ApiResponse {
  const page = reached(caller, request.params.page);
  return page === undefined || !isPageLike(page)
    ? NOT_FOUND
    : answer(200, pageOut(page, caller.workspace));
}

function readDatabase(caller: Caller, request: ApiRequest): ApiResponse {
  const database = reached(caller, request.params.database);
  return database?.type !== "database"
    ? NOT_FOUND
    : answer(200, pageOut(database, caller.workspace));
}

export const PUBLIC_API_ROUTES: RouteTable = {
  "GET /v1/users/me": withCaller((caller) =>
    answer(200, {
      object: "user",
      id: caller.integration.id,
      type: "bot",
      name: caller.integration.name,
      bot: {},
    }),
  ),
  "POST /v1/search": withCaller(search),
  "GET /v1/pages/:page": withCaller(readPage),
  "PATCH /v1/pages/:page": withCaller(updatePage),
  "POST /v1/pages": withCaller(createPage),
  "GET /v1/databases/:database": withCaller(readDatabase),
  "POST /v1/databases/:database/query": withCaller(queryRows),
  "GET /v1/blocks/:block/children": withCaller(children),
  "PATCH /v1/blocks/:block/children": withCaller(appendBlocks),
};
