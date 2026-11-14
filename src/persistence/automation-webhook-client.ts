// A database automation's "Send webhook" (ADR-0014): the client asks the
// server of the open workspace to post the page; nothing is read back,
// and a webhook missed while offline is not sent later, as Notion's is
// not.
import type { SyncRequest } from "../state/index.ts";
import { getJson, type Sync } from "./sync-session.ts";

export type WebhookRequest = Extract<
  SyncRequest,
  { kind: "automation-webhook" }
>;

export function isWebhookRequest(
  request: SyncRequest,
): request is WebhookRequest {
  return request.kind === "automation-webhook";
}

export async function answerWebhook(
  sync: Sync,
  request: WebhookRequest,
  workspaceId: string | null,
): Promise<void> {
  if (workspaceId === null) return;
  try {
    await getJson(
      sync.send,
      `/api/workspaces/${workspaceId}/automation-webhook`,
      {
        url: request.url,
        payload: request.payload,
      },
    );
  } catch {
    // Refused (an address inside) or offline: nothing to show.
  }
}
