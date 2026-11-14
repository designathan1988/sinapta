// The server's workspace answers and events, parsed at the boundary.
import * as v from "valibot";

const workspaceSchema = v.object({
  id: v.string(),
  name: v.string(),
  icon: v.nullable(v.string()),
  role: v.string(),
  members: v.number(),
  limitsTeamspaces: v.optional(v.number(), 0),
});

const loggedSchema = v.object({
  seq: v.number(),
  clientId: v.string(),
  operations: v.unknown(),
});

const listSchema = v.object({
  workspaces: v.array(workspaceSchema),
  lastWorkspaceId: v.nullable(v.string()),
});
const createdSchema = v.object({ workspace: workspaceSchema, seq: v.number() });
const downloadSchema = v.object({
  workspace: workspaceSchema,
  seq: v.number(),
  snapshot: v.unknown(),
  operations: v.array(loggedSchema),
  // A guest's access to each page shared with them.
  access: v.optional(
    v.record(v.string(), v.picklist(["full", "edit", "comment", "view"])),
  ),
});

export type ServerWorkspace = v.InferOutput<typeof workspaceSchema>;
export type Logged = v.InferOutput<typeof loggedSchema>;
export type Download = v.InferOutput<typeof downloadSchema>;

function read<TSchema extends v.GenericSchema>(
  schema: TSchema,
  value: unknown,
): v.InferOutput<TSchema> | undefined {
  const result = v.safeParse(schema, value);
  return result.success ? result.output : undefined;
}

export const readWorkspaceList = (value: unknown) => read(listSchema, value);
export const readCreated = (value: unknown) => read(createdSchema, value);
export const readDownload = (value: unknown) => read(downloadSchema, value);

// An "operations" event's data: its text is JSON.
export function readLoggedEvent(text: string): Logged | undefined {
  try {
    const value: unknown = JSON.parse(text);
    return read(loggedSchema, value);
  } catch {
    return undefined;
  }
}

const peopleSchema = v.object({
  members: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      email: v.string(),
      role: v.string(),
    }),
  ),
  invites: v.array(v.object({ email: v.string(), role: v.string() })),
});

export const readPeople = (value: unknown) => {
  const people = read(peopleSchema, value);
  return people === undefined
    ? undefined
    : { members: people.members, invites: people.invites };
};

const sharingSchema = v.object({
  general: v.picklist(["invited", "workspace", "web"]),
  published: v.boolean(),
  people: v.array(
    v.object({
      email: v.string(),
      name: v.nullable(v.string()),
      access: v.picklist(["full", "edit", "comment", "view"]),
    }),
  ),
});

export const readSharing = (value: unknown, pageId: string) => {
  const sharing = read(sharingSchema, value);
  return sharing === undefined ? undefined : { pageId, ...sharing };
};

const presenceSchema = v.object({
  people: v.array(
    v.object({
      userId: v.string(),
      name: v.string(),
      pageId: v.nullable(v.string()),
      blockId: v.optional(v.nullable(v.string())),
      offset: v.optional(v.nullable(v.number())),
    }),
  ),
});

// A "presence" event's data: its text is JSON.
export function readPresenceEvent(text: string) {
  try {
    const value: unknown = JSON.parse(text);
    return read(presenceSchema, value)?.people.map((person) => ({
      userId: person.userId,
      name: person.name,
      pageId: person.pageId,
      blockId: person.blockId ?? null,
      offset: person.offset ?? null,
    }));
  } catch {
    return undefined;
  }
}

const outboxSchema = v.object({
  workspaceId: v.string(),
  entries: v.array(v.unknown()),
});

// The stored outbox, or undefined when there is none or it is unreadable.
export const readOutbox = (value: unknown) => read(outboxSchema, value);

const sharedSchema = v.object({ pageIds: v.array(v.string()) });

export const readSharedIds = (value: unknown) =>
  read(sharedSchema, value)?.pageIds;

const listedSchema = v.object({
  teamspaces: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      access: v.string(),
      owner: v.string(),
      isMember: v.boolean(),
      hasAsked: v.boolean(),
      isArchived: v.boolean(),
      hasOverrides: v.boolean(),
      requests: v.array(v.object({ userId: v.string(), name: v.string() })),
    }),
  ),
});

export const readTeamspaceList = (value: unknown) =>
  read(listedSchema, value)?.teamspaces;

const joinedSchema = v.object({ joined: v.boolean() });

// True once the server put this person in the teamspace.
export const readJoined = (value: unknown) => read(joinedSchema, value)?.joined;

const integrationsSchema = v.object({
  integrations: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      pageIds: v.array(v.string()),
    }),
  ),
  created: v.optional(
    v.object({ id: v.string(), name: v.string(), secret: v.string() }),
  ),
});

export const readIntegrations = (value: unknown) =>
  read(integrationsSchema, value);
