// A database automation's "Send webhook" and "Send Slack notification"
// (ADR-0014): the client asks the server of the open workspace to post;
// nothing is read back, and one missed while offline is not sent later,
// as Notion's is not.
import type { SyncRequest } from "../state/index.ts";
import { getJson, type Sync } from "./sync-session.ts";

export type WebhookRequest = Extract<
  SyncRequest,
  { kind: "automation-webhook" | "automation-slack" }
>;

export function isWebhookRequest(
  request: SyncRequest,
): request is WebhookRequest {
  return (
    request.kind === "automation-webhook" || request.kind === "automation-slack"
  );
}

// The server's path and what it is sent, by kind.
function postOf(request: WebhookRequest): [string, unknown] {
  if (request.kind === "automation-slack")
    return ["automation-slack", { text: request.text }];
  return ["automation-webhook", { url: request.url, payload: request.payload }];
}

export async function answerWebhook(
  sync: Sync,
  request: WebhookRequest,
  workspaceId: string | null,
): Promise<void> {
  if (workspaceId === null) return;
  const [path, body] = postOf(request);
  try {
    await getJson(sync.send, `/api/workspaces/${workspaceId}/${path}`, body);
  } catch {
    // Refused (an address inside) or offline: nothing to show.
  }
}
