// Settings › Connections' apps on this server (ADR-0013, ADR-0014): which
// apps a workspace has connected, the address each reaches, a channel's
// webhook told of the workspace's notices, and the calendars' events.
import * as v from "valibot";
import { appSpec, needsAddress, APP_IDS } from "../src/model/index.ts";
import { answer, type ApiContext, type RouteTable } from "./api.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import { parseCalendar, upcoming, type CalendarEvent } from "./ical.ts";
import { isFetchable } from "./link-preview.ts";
import { appConnectionRowSchema, readRows } from "./rows.schema.ts";
import { sessionUser } from "./sessions.ts";
import { membership } from "./workspaces.ts";

const connectSchema = v.object({
  app: v.picklist(APP_IDS),
  address: v.optional(v.pipe(v.string(), v.trim(), v.url(), v.maxLength(2000))),
});
const removeSchema = v.object({ app: v.picklist(APP_IDS) });

const EVENTS_SHOWN = 8;

interface AppRow {
  readonly app: string;
  readonly address: string | null;
}

function rowsOf(context: ApiContext, workspaceId: string): AppRow[] {
  const rows = context.db
    .prepare(
      "SELECT app, address FROM app_connections WHERE workspace_id = ? ORDER BY created_at",
    )
    .all(workspaceId);
  return readRows(appConnectionRowSchema, rows);
}

// What the client is told: the apps, and only the host of each address,
// since a webhook's address is its secret.
function listOf(context: ApiContext, workspaceId: string) {
  return {
    apps: rowsOf(context, workspaceId).map((row) => ({
      app: row.app,
      host:
        row.address === null ? null : (URL.parse(row.address)?.host ?? null),
    })),
  };
}

function memberWorkspace(
  request: ApiRequest,
  context: ApiContext,
): { workspaceId: string; userId: string } | ApiResponse {
  const user = sessionUser(context, request);
  if (user === undefined) return answer(401, { error: "signed-out" });
  const workspace = membership(context, request.params.id ?? "", user.id);
  if (workspace === undefined) return answer(404, { error: "not-found" });
  return { workspaceId: workspace.id, userId: user.id };
}

// An app's address: required by a webhook or a calendar, on the open web.
function addressError(app: string, address: string | undefined) {
  const spec = appSpec(app);
  if (spec === undefined || !needsAddress(spec)) return undefined;
  const url = address === undefined ? undefined : URL.parse(address);
  if (url?.protocol !== "https:" || !isFetchable(url)) {
    return answer(400, { error: "bad-address" });
  }
  return undefined;
}

function connect(request: ApiRequest, context: ApiContext): ApiResponse {
  const at = memberWorkspace(request, context);
  if ("status" in at) return at;
  const { app, address } = v.parse(connectSchema, request.body);
  const refused = addressError(app, address);
  if (refused !== undefined) return refused;
  const spec = appSpec(app);
  const kept = spec !== undefined && needsAddress(spec) ? address : undefined;
  context.db
    .prepare(
      "INSERT OR REPLACE INTO app_connections (workspace_id, app, address, connected_by, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .run(at.workspaceId, app, kept ?? null, at.userId, context.now());
  return answer(200, listOf(context, at.workspaceId));
}

async function eventsOf(
  context: ApiContext,
  workspaceId: string,
): Promise<CalendarEvent[]> {
  const calendars = rowsOf(context, workspaceId).filter(
    (row) => appSpec(row.app)?.kind === "calendar" && row.address !== null,
  );
  const { outside } = context;
  if (outside === undefined) return [];
  const texts = await Promise.all(
    calendars.map((row) => outside.getText(new URL(row.address ?? ""))),
  );
  const today = new Date(context.now()).toISOString().slice(0, 10);
  const events = texts.flatMap((text) =>
    text === undefined ? [] : parseCalendar(text),
  );
  return upcoming(events, today, EVENTS_SHOWN);
}

// A notice of the workspace, posted to each connected channel.
export async function notifyChannels(
  context: ApiContext,
  workspaceId: string,
  text: string,
): Promise<void> {
  const channels = rowsOf(context, workspaceId).filter(
    (row) => appSpec(row.app)?.kind === "webhook" && row.address !== null,
  );
  const { outside } = context;
  if (outside === undefined) return;
  await Promise.all(
    channels.map((row) =>
      outside.postJson(new URL(row.address ?? ""), { text }),
    ),
  );
}

export const APP_ROUTES: RouteTable = {
  "GET /api/workspaces/:id/apps": (request, context) => {
    const at = memberWorkspace(request, context);
    if ("status" in at) return at;
    return answer(200, listOf(context, at.workspaceId));
  },
  "POST /api/workspaces/:id/apps": connect,
  "POST /api/workspaces/:id/apps/remove": (request, context) => {
    const at = memberWorkspace(request, context);
    if ("status" in at) return at;
    const { app } = v.parse(removeSchema, request.body);
    context.db
      .prepare("DELETE FROM app_connections WHERE workspace_id = ? AND app = ?")
      .run(at.workspaceId, app);
    return answer(200, listOf(context, at.workspaceId));
  },
  "GET /api/workspaces/:id/apps/events": async (request, context) => {
    const at = memberWorkspace(request, context);
    if ("status" in at) return at;
    return answer(200, { events: await eventsOf(context, at.workspaceId) });
  },
};
