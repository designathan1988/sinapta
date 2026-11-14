// A database automation's "Send webhook", as Notion's: a member's client
// asks, and the server posts the page the automation ran on to the
// address, as JSON, with the same guards as a connected app's webhook (a
// time limit, no redirects, no host on this machine or its network).
import * as v from "valibot";
import { answer, type ApiContext, type RouteTable } from "./api.ts";
import { webhookBodySchema } from "./automation-webhook.schema.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import { isFetchable } from "./link-preview.ts";
import { sessionUser } from "./sessions.ts";
import { membership } from "./workspaces.ts";

function addressOf(text: string): URL | undefined {
  try {
    const url = new URL(text);
    return isFetchable(url) ? url : undefined;
  } catch {
    return undefined;
  }
}

async function send(
  request: ApiRequest,
  context: ApiContext,
): Promise<ApiResponse> {
  const user = sessionUser(context, request);
  if (user === undefined) return answer(401, { error: "signed-out" });
  const workspace = membership(context, request.params.id ?? "", user.id);
  if (workspace === undefined) return answer(404, { error: "not-found" });
  const parsed = v.safeParse(webhookBodySchema, request.body);
  if (!parsed.success) return answer(400, { error: "bad-request" });
  const url = addressOf(parsed.output.url);
  if (url === undefined) return answer(400, { error: "bad-address" });
  await context.outside?.postJson(url, parsed.output.payload);
  return answer(200, { sent: true });
}

export const AUTOMATION_WEBHOOK_ROUTES: RouteTable = {
  "POST /api/workspaces/:id/automation-webhook": send,
};
