// Every route of the API, by method and path.
import { ACCOUNT_ROUTES } from "./account-routes.ts";
import { AI_ROUTES } from "./ai.ts";
import { AI_STREAM_ROUTES } from "./ai-stream.ts";
import { TEAMSPACE_ROUTES } from "./teamspace-routes.ts";
import { LINK_PREVIEW_ROUTES } from "./link-preview.ts";
import { INTEGRATION_ROUTES } from "./integration-routes.ts";
import { PUBLIC_API_ROUTES } from "./public-api.ts";
import { AI_FILL_ROUTES } from "./ai-fill.ts";
import { answer, type RouteTable } from "./api.ts";
import { countRowSchema, readRow } from "./rows.schema.ts";
import { MEMBER_ROUTES } from "./member-routes.ts";
import { PRESENCE_ROUTES } from "./presence.ts";
import { SHARING_ROUTES } from "./sharing-routes.ts";
import { localTranscriber, transcriptionRoutes } from "./transcription.ts";
import { WORKSPACE_ROUTES } from "./workspace-routes.ts";

const HEALTH_ROUTES: RouteTable = {
  "GET /api/health": (_request, context) => {
    const users = readRow(
      countRowSchema,
      context.db.prepare("SELECT COUNT(*) AS count FROM users").get(),
    );
    return answer(200, { ok: true, users: users?.count ?? 0 });
  },
};

export const ROUTES: RouteTable = {
  ...HEALTH_ROUTES,
  ...transcriptionRoutes(localTranscriber()),
  ...ACCOUNT_ROUTES,
  ...WORKSPACE_ROUTES,
  ...MEMBER_ROUTES,
  ...SHARING_ROUTES,
  ...PRESENCE_ROUTES,
  ...AI_ROUTES,
  ...AI_STREAM_ROUTES,
  ...TEAMSPACE_ROUTES,
  ...LINK_PREVIEW_ROUTES,
  ...INTEGRATION_ROUTES,
  ...PUBLIC_API_ROUTES,
  ...AI_FILL_ROUTES,
};
