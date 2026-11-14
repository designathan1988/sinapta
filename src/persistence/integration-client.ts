// Settings › Connections on the server (ADR-0013): the integrations, making
// one, removing one, and connecting a page to one.
import { setIntegrations, type SyncRequest } from "../state/index.ts";
import { getJson, type Sync } from "./sync-session.ts";
import { readIntegrations } from "./sync.schema.ts";

export type IntegrationRequest = Extract<
  SyncRequest,
  {
    kind:
      | "integrations"
      | "create-integration"
      | "remove-integration"
      | "connect-integration";
  }
>;

const KINDS: readonly string[] = [
  "integrations",
  "create-integration",
  "remove-integration",
  "connect-integration",
];

export function isIntegrationRequest(
  request: SyncRequest,
): request is IntegrationRequest {
  return KINDS.includes(request.kind);
}

function routeOf(request: IntegrationRequest, base: string) {
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
  const [path, body] = routeOf(request, `/api/workspaces/${workspaceId}`);
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
