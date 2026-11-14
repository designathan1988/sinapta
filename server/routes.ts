// Every route of the API, by method and path.
import { ACCOUNT_ROUTES } from "./account-routes.ts";
import { answer, type RouteTable } from "./api.ts";
import { countRowSchema, readRow } from "./rows.schema.ts";
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
  ...ACCOUNT_ROUTES,
  ...WORKSPACE_ROUTES,
};
