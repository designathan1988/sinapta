// The server's workspace answers and events, parsed at the boundary.
import * as v from "valibot";

const workspaceSchema = v.object({
  id: v.string(),
  name: v.string(),
  icon: v.nullable(v.string()),
  role: v.string(),
  members: v.number(),
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
