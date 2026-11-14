// Who a batch of changes newly mentions, so that each is told on their
// other devices, as Notion's notices are: once per block and person, never
// the author, only members of the workspace; and pages shared with them.
import type { ApiContext } from "./api.ts";
import { pushNotice } from "./push.ts";
import { findUser } from "./users.ts";
import { membership } from "./workspaces.ts";

// The blocks and people already told about, by workspace.
const told = new Set<string>();
const MAX_TOLD = 10_000;

function isRecord(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

// Every person mention inside a value, at any depth.
function peopleIn(value: unknown, found: Set<string>): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) peopleIn(item, found);
    return found;
  }
  if (!isRecord(value)) return found;
  const kind: unknown = Reflect.get(value, "kind");
  const userId: unknown = Reflect.get(value, "userId");
  if (kind === "person" && typeof userId === "string") found.add(userId);
  for (const key of Reflect.ownKeys(value)) {
    peopleIn(Reflect.get(value, key), found);
  }
  return found;
}

// The block an operation changes, and the people it mentions.
function mentionsOf(operation: unknown): {
  blockId: string;
  people: Set<string>;
} {
  const record: unknown = isRecord(operation)
    ? (Reflect.get(operation, "record") ?? Reflect.get(operation, "patch"))
    : undefined;
  const id: unknown = isRecord(operation)
    ? (Reflect.get(operation, "id") ??
      (isRecord(record) ? Reflect.get(record, "id") : undefined))
    : undefined;
  return {
    blockId: typeof id === "string" ? id : "",
    people: peopleIn(record, new Set()),
  };
}

export function newlyMentioned(
  workspaceId: string,
  authorId: string,
  operations: readonly unknown[],
): string[] {
  const people = new Set<string>();
  for (const operation of operations) {
    const { blockId, people: mentioned } = mentionsOf(operation);
    for (const userId of mentioned) {
      const key = `${workspaceId}:${blockId}:${userId}`;
      if (userId === authorId || told.has(key)) continue;
      if (told.size > MAX_TOLD) told.clear();
      told.add(key);
      people.add(userId);
    }
  }
  return [...people];
}

export async function pushMentions(
  context: ApiContext,
  change: {
    readonly workspaceId: string;
    readonly author: { readonly id: string; readonly name: string };
    readonly operations: readonly unknown[];
  },
): Promise<void> {
  const { workspaceId, author } = change;
  const people = newlyMentioned(
    workspaceId,
    author.id,
    change.operations,
  ).filter((userId) => membership(context, workspaceId, userId) !== undefined);
  await pushNotice(context, people, {
    title: "Pagecraft",
    body: `${author.name} mentioned you`,
    url: "/",
  });
}

// A page shared with someone who has an account: told on their devices.
export async function pushShared(
  context: ApiContext,
  email: string,
): Promise<void> {
  const user = findUser(context, email);
  if (user === undefined) return;
  await pushNotice(context, [user.id], {
    title: "Pagecraft",
    body: "A page was shared with you",
    url: "/",
  });
}
