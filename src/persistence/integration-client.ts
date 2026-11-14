// Settings › Connections on the server (ADR-0013): the integrations, making
// one, removing one, and connecting a page to one; and the apps connected,
// with the coming events of the calendars among them (ADR-0014).
import { setApps, setIntegrations, type SyncRequest } from "../state/index.ts";
import { readApps, readEvents } from "./app.schema.ts";
import { getJson, type Sync } from "./sync-session.ts";
import { readIntegrations } from "./sync.schema.ts";

export type IntegrationRequest = Extract<
  SyncRequest,
  {
    kind:
      | "integrations"
      | "create-integration"
      | "remove-integration"
      | "connect-integration"
      | "connect-app"
      | "disconnect-app";
  }
>;

const KINDS: readonly string[] = [
  "integrations",
  "create-integration",
  "remove-integration",
  "connect-integration",
  "connect-app",
  "disconnect-app",
];

export function isIntegrationRequest(
  request: SyncRequest,
): request is IntegrationRequest {
  return KINDS.includes(request.kind);
}

type AppRequest = Extract<
  IntegrationRequest,
  { kind: "connect-app" | "disconnect-app" }
>;

function isAppRequest(request: IntegrationRequest): request is AppRequest {
  return request.kind === "connect-app" || request.kind === "disconnect-app";
}

// The apps as the server lists them, with the calendars' coming events.
async function answerApps(
  sync: Sync,
  base: string,
  request?: AppRequest,
): Promise<void> {
  const asked =
    request === undefined
      ? getJson(sync.send, `${base}/apps`)
      : request.kind === "connect-app"
        ? getJson(sync.send, `${base}/apps`, {
            app: request.app,
            ...(request.address === undefined
              ? {}
              : { address: request.address }),
          })
        : getJson(sync.send, `${base}/apps/remove`, { app: request.app });
  const apps = readApps(await asked);
  if (apps === undefined) return;
  const events = readEvents(await getJson(sync.send, `${base}/apps/events`));
  sync.dispatch(setApps.create({ apps, ...(events && { events }) }));
}

function routeOf(
  request: Exclude<IntegrationRequest, AppRequest>,
  base: string,
) {
  const integrations = `${base}/integrations`;
  switch (request.kind) {
    case "integrations":
      return [integrations, undefined] as const;
    case "create-integration":
      return [integrations, { name: request.name }] as const;
    case "remove-integration":
      return [`${integrations}/${request.integrationId}/remove`, {}] as const;
    case "connect-integration":
      return [
        `${integrations}/${request.integrationId}/pages`,
        { pageId: request.pageId, connected: request.connected },
      ] as const;
  }
}

export async function answerIntegrations(
  sync: Sync,
  request: IntegrationRequest,
  workspaceId: string | null,
): Promise<void> {
  if (workspaceId === null) return;
  const base = `/api/workspaces/${workspaceId}`;
  if (isAppRequest(request)) {
    await answerApps(sync, base, request);
    return;
  }
  if (request.kind === "integrations") void answerApps(sync, base);
  const [path, body] = routeOf(request, base);
  const reply = readIntegrations(await getJson(sync.send, path, body));
  if (reply === undefined) return;
  sync.dispatch(
    setIntegrations.create({
      integrations: reply.integrations,
      ...(reply.created !== undefined && {
        newSecret: { name: reply.created.name, secret: reply.created.secret },
      }),
    }),
  );
}
