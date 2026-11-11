import * as v from "valibot";
import { blockSchema, type Block, type BlockProps } from "./block.schema.ts";
import { blockIdSchema, type BlockId, type ViewId } from "./id.schema.ts";
import type { RecordError, WorkspaceFileError } from "./parse-error.ts";
import { viewSchema, type View } from "./view.schema.ts";

export const SCHEMA_VERSION = 12;

export const settingsSchema = v.object({
  theme: v.picklist(["system", "light", "dark"]),
});

const workspaceFileSchema = v.object({
  schemaVersion: v.number(),
  rootIds: v.array(blockIdSchema),
  blocks: v.record(v.string(), v.unknown()),
  views: v.record(v.string(), v.unknown()),
  settings: settingsSchema,
});

export type Settings = v.InferOutput<typeof settingsSchema>;
export type Theme = Settings["theme"];

export interface Workspace {
  readonly blocks: Readonly<Record<BlockId, Block>>;
  readonly views: Readonly<Record<ViewId, View>>;
  readonly rootIds: readonly BlockId[];
  readonly settings: Settings;
}

// Block type name to the schema of that type's props, supplied by the
// block registry so that the model does not know any block type.
export type PropsSchema = v.GenericSchema<unknown, BlockProps>;
export type PropsSchemas = ReadonlyMap<string, PropsSchema>;

export type ParseWorkspaceResult =
  | {
      readonly ok: true;
      readonly workspace: Workspace;
      readonly skipped: readonly RecordError[];
    }
  | { readonly ok: false; readonly error: WorkspaceFileError };

type RecordResult<TRecord> =
  { readonly record: TRecord } | { readonly error: RecordError };

function issuePath(issues: readonly v.BaseIssue<unknown>[]): string {
  return issues[0] === undefined ? "" : (v.getDotPath(issues[0]) ?? "");
}

function invalid(recordId: string, path: string): { error: RecordError } {
  return { error: { kind: "invalid-record", recordId, path } };
}

function parseBlock(
  key: string,
  json: unknown,
  propsSchemas: PropsSchemas,
): RecordResult<Block> {
  const envelope = v.safeParse(blockSchema, json);
  if (!envelope.success) return invalid(key, issuePath(envelope.issues));
  const block = envelope.output;
  if (block.id !== key) return invalid(key, "id");
  const propsSchema = propsSchemas.get(block.type);
  if (propsSchema === undefined) {
    return { error: { kind: "unknown-type", recordId: key, type: block.type } };
  }
  const props = v.safeParse(propsSchema, block.props);
  if (!props.success) {
    return invalid(key, `props.${issuePath(props.issues)}`);
  }
  return {
    record: {
      ...block,
      props: v.parse(blockSchema.entries.props, props.output),
    },
  };
}

function parseView(key: string, json: unknown): RecordResult<View> {
  const result = v.safeParse(viewSchema, json);
  if (!result.success) return invalid(key, issuePath(result.issues));
  return result.output.id === key
    ? { record: result.output }
    : invalid(key, "id");
}

interface Collected<TRecord> {
  readonly records: TRecord[];
  readonly errors: RecordError[];
}

function collect<TRecord>(
  entries: Record<string, unknown>,
  parseRecord: (key: string, json: unknown) => RecordResult<TRecord>,
): Collected<TRecord> {
  const collected: Collected<TRecord> = { records: [], errors: [] };
  for (const [key, json] of Object.entries(entries)) {
    const result = parseRecord(key, json);
    if ("record" in result) collected.records.push(result.record);
    else collected.errors.push(result.error);
  }
  return collected;
}

function indexBlocks(blocks: readonly Block[]): Record<BlockId, Block> {
  const byId: Record<BlockId, Block> = {};
  for (const block of blocks) byId[block.id] = block;
  return byId;
}

function indexViews(views: readonly View[]): Record<ViewId, View> {
  const byId: Record<ViewId, View> = {};
  for (const view of views) byId[view.id] = view;
  return byId;
}

// The one entry point for workspace JSON, used by storage load and by file
// import after migrations have brought the file to SCHEMA_VERSION.
export function parseWorkspaceFile(
  json: unknown,
  propsSchemas: PropsSchemas,
): ParseWorkspaceResult {
  const file = v.safeParse(workspaceFileSchema, json);
  if (!file.success) {
    return {
      ok: false,
      error: { kind: "invalid-file", path: issuePath(file.issues) },
    };
  }
  const blocks = collect(file.output.blocks, (key, value) =>
    parseBlock(key, value, propsSchemas),
  );
  const views = collect(file.output.views, parseView);
  const workspace: Workspace = {
    blocks: indexBlocks(blocks.records),
    views: indexViews(views.records),
    rootIds: file.output.rootIds,
    settings: file.output.settings,
  };
  return { ok: true, workspace, skipped: [...blocks.errors, ...views.errors] };
}
