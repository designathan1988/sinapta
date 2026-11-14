// Who is where (ADR-0013): each person's open page in each workspace, and
// the block they write in, kept
// in memory for a minute after they last said so, and sent to everyone
// listening to that workspace whenever it changes.
import type { ApiContext, RouteTable } from "./api.ts";
import { answer } from "./api.ts";
import { sessionUser } from "./sessions.ts";
import { membership } from "./workspaces.ts";

const FRESH_MS = 60_000;
export const PRESENCE_EVENT = "presence";

interface Here {
  readonly userId: string;
  readonly name: string;
  readonly pageId: string | null;
  // The block they are writing in, when any, and where their caret is.
  readonly blockId: string | null;
  readonly offset: number | null;
  readonly at: number;
}

const present = new WeakMap<ApiContext, Map<string, Map<string, Here>>>();

function workspaceOf(context: ApiContext, workspaceId: string) {
  const all = present.get(context) ?? new Map<string, Map<string, Here>>();
  present.set(context, all);
  const people = all.get(workspaceId) ?? new Map<string, Here>();
  all.set(workspaceId, people);
  return people;
}

// Everyone seen in the workspace within the last minute.
export function presenceIn(context: ApiContext, workspaceId: string): Here[] {
  const people = workspaceOf(context, workspaceId);
  const now = context.now();
  for (const [id, here] of people) {
    if (now - here.at > FRESH_MS) people.delete(id);
  }
  return [...people.values()];
}

function textOf(body: unknown, key: "pageId" | "blockId"): string | null {
  if (typeof body !== "object" || body === null) return null;
  const value: unknown = Object.entries(body).find(
    ([name]) => name === key,
  )?.[1];
  return typeof value === "string" ? value : null;
}

function offsetOf(body: unknown): number | null {
  if (typeof body !== "object" || body === null) return null;
  const value: unknown = Object.entries(body).find(
    ([name]) => name === "offset",
  )?.[1];
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

export const PRESENCE_ROUTES: RouteTable = {
  "POST /api/workspaces/:id/presence": (request, context) => {
    const user = sessionUser(context, request);
    if (user === undefined) return answer(401, { error: "signed-out" });
    const workspace = membership(context, request.params.id ?? "", user.id);
    if (workspace === undefined) return answer(404, { error: "not-found" });
    workspaceOf(context, workspace.id).set(user.id, {
      userId: user.id,
      name: user.name,
      pageId: textOf(request.body, "pageId"),
      blockId: textOf(request.body, "blockId"),
      offset: offsetOf(request.body),
      at: context.now(),
    });
    const people = presenceIn(context, workspace.id);
    context.events.publish(workspace.id, PRESENCE_EVENT, { people });
    return answer(200, { people });
  },
};
