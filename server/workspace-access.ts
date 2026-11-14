// What each person in a workspace reads and may change (ADR-0013): a guest
// the pages shared with them; a member all but the others' private pages.
import * as v from "valibot";
import {
  parseWireOperations,
  SCHEMA_VERSION,
  type Operation,
  type Workspace,
} from "../src/model/index.ts";
import { answer, type ApiContext } from "./api.ts";
import {
  guestWorkspace,
  mayWrite,
  reachOf,
  sharedWith,
  visibleTo,
  type Reach,
} from "./guest-access.ts";
import type { ApiResponse } from "./http-exchange.ts";
import {
  mayMemberWrite,
  memberReach,
  memberVisible,
  type Seeing,
  type Who,
} from "./member-access.ts";
import type { UserRow, WorkspaceRow } from "./rows.schema.ts";
import type { Access } from "./sharing.ts";
import type { Listener } from "./workspace-events.ts";
import { currentState, currentWorkspace } from "./workspace-state.ts";

export const OPERATIONS_EVENT = "operations";

export interface Member {
  readonly user: UserRow;
  readonly workspace: WorkspaceRow;
}

interface Sight {
  readonly reach: Reach;
  // The pages shared with this person, at their access.
  readonly shared: Map<string, Access>;
  readonly isGuest: boolean;
}

function whoOf(member: Member): Who {
  const isOwner = member.workspace.role === "owner";
  return {
    userId: member.user.id,
    isOwner,
    mayMakeTeamspaces: isOwner || member.workspace.limitsTeamspaces !== 1,
  };
}

function sightOf(member: Member, context: ApiContext, workspace: Workspace) {
  const { id } = member.workspace;
  if (member.workspace.role === "guest") {
    const shared = sharedWith(context, id, member.user.email);
    return { reach: reachOf(workspace, shared), shared, isGuest: true };
  }
  const viewer = {
    workspaceId: id,
    email: member.user.email,
    ...whoOf(member),
  };
  return { ...memberReach(context, viewer, workspace), isGuest: false };
}

function isWhole(sight: Sight, workspace: Workspace): boolean {
  return Object.keys(workspace.blocks).every((id) => sight.reach.has(id));
}

function seen(
  operations: readonly Operation[],
  sight: Sight,
  context: Seeing,
): Operation[] {
  return sight.isGuest
    ? visibleTo(operations, sight.reach, context.workspace)
    : memberVisible(operations, sight.reach, context);
}

// The workspace as this person reads it; undefined when they read it all,
// as it is stored.
export function partialDownload(
  member: Member,
  context: ApiContext,
): ApiResponse | undefined {
  const state = currentState(context, member.workspace.id);
  const isGuest = member.workspace.role === "guest";
  if (state === undefined) {
    return isGuest ? answer(404, { error: "not-found" }) : undefined;
  }
  const sight = sightOf(member, context, state.workspace);
  if (!sight.isGuest && isWhole(sight, state.workspace)) return undefined;
  const snapshot = {
    schemaVersion: SCHEMA_VERSION,
    ...guestWorkspace(state.workspace, sight.reach),
  };
  return answer(200, {
    workspace: member.workspace,
    seq: state.seq,
    snapshot,
    operations: [],
    access: Object.fromEntries(sight.shared),
  });
}

export function mayChangeAll(
  member: Member,
  context: ApiContext,
  operations: readonly Operation[],
): boolean {
  const workspace = currentWorkspace(context, member.workspace.id);
  if (workspace === undefined) return member.workspace.role !== "guest";
  const sight = sightOf(member, context, workspace);
  if (sight.isGuest) return mayWrite(operations, sight.reach, workspace);
  const who = whoOf(member);
  return mayMemberWrite(operations, sight.reach, { workspace, ...who });
}

// The operations of a catch-up read, as this person sees them.
export function seenOperations<T extends { readonly operations: unknown }>(
  member: Member,
  context: ApiContext,
  logged: readonly T[],
): T[] {
  const workspace = currentWorkspace(context, member.workspace.id);
  if (workspace === undefined) return [];
  const sight = sightOf(member, context, workspace);
  const who = whoOf(member);
  return logged.map((entry) => ({
    ...entry,
    operations: seen(parseWireOperations(entry.operations) ?? [], sight, {
      workspace,
      ...who,
    }),
  }));
}

const loggedSchema = v.object({
  seq: v.number(),
  clientId: v.string(),
  operations: v.unknown(),
});

// Each person's stream carries only the operations they see; the others'
// events still come, empty, so that no number is missing.
export function streamFilter(
  member: Member,
  context: ApiContext,
  send: Listener,
): Listener {
  const { id } = member.workspace;
  const start = currentWorkspace(context, id);
  if (start === undefined) return send;
  const sight = sightOf(member, context, start);
  const who = whoOf(member);
  return (event, data) => {
    if (event !== OPERATIONS_EVENT) {
      send(event, data);
      return;
    }
    const logged = v.safeParse(loggedSchema, data);
    const workspace = currentWorkspace(context, id);
    if (!logged.success || workspace === undefined) return;
    const operations = parseWireOperations(logged.output.operations) ?? [];
    send(event, {
      ...logged.output,
      operations: seen(operations, sight, { workspace, ...who }),
    });
  };
}
