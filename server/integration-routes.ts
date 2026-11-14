// Settings › Connections on the server (ADR-0013): the workspace's
// integrations, making one (its secret shown once), removing one, and the
// pages connected to each.
import * as v from "valibot";
import { answer, type RouteTable } from "./api.ts";
import {
  connectPage,
  createIntegration,
  integrationsOf,
  removeIntegration,
} from "./integrations.ts";
import { askerOf, isAsker } from "./member-asker.ts";

const nameSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100)),
});
const connectSchema = v.object({ pageId: v.string(), connected: v.boolean() });

export const INTEGRATION_ROUTES: RouteTable = {
  "GET /api/workspaces/:id/integrations": (request, context) => {
    const asker = askerOf(request, context);
    if (!isAsker(asker)) return asker;
    return answer(200, {
      integrations: integrationsOf(context, asker.workspace.id),
    });
  },
  "POST /api/workspaces/:id/integrations": (request, context) => {
    const asker = askerOf(request, context);
    if (!isAsker(asker)) return asker;
    const { name } = v.parse(nameSchema, request.body);
    const workspaceId = asker.workspace.id;
    const made = createIntegration(context, {
      workspaceId,
      name,
      by: asker.user.id,
    });
    return answer(201, {
      created: { id: made.id, name, secret: made.secret },
      integrations: integrationsOf(context, workspaceId),
    });
  },
  "POST /api/workspaces/:id/integrations/:integration/remove": (
    request,
    context,
  ) => {
    const asker = askerOf(request, context);
    if (!isAsker(asker)) return asker;
    const workspaceId = asker.workspace.id;
    removeIntegration(context, workspaceId, request.params.integration ?? "");
    return answer(200, { integrations: integrationsOf(context, workspaceId) });
  },
  "POST /api/workspaces/:id/integrations/:integration/pages": (
    request,
    context,
  ) => {
    const asker = askerOf(request, context);
    if (!isAsker(asker)) return asker;
    const workspaceId = asker.workspace.id;
    const integrationId = request.params.integration ?? "";
    const known = integrationsOf(context, workspaceId);
    if (!known.some((each) => each.id === integrationId)) {
      return answer(404, { error: "not-found" });
    }
    const { pageId, connected } = v.parse(connectSchema, request.body);
    connectPage(context, { integrationId, pageId, isConnected: connected });
    return answer(200, { integrations: integrationsOf(context, workspaceId) });
  },
};
