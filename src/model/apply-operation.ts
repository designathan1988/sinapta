// The only module that produces new workspace data from operations.
import type { Block } from "./block.schema.ts";
import type { BlockId, ViewId } from "./id.schema.ts";
import type {
  ChangedRecords,
  ListRef,
  Operation,
  OperationError,
} from "./operation.ts";
import type { View } from "./view.schema.ts";
import type { Settings, Workspace } from "./workspace.schema.ts";

export type ApplyResult =
  | {
      readonly ok: true;
      readonly workspace: Workspace;
      // Applying these restores the workspace that was passed in.
      readonly inverse: readonly Operation[];
      readonly changed: ChangedRecords;
    }
  | { readonly ok: false; readonly error: OperationError };

// A private working copy. Record maps are copied once, records are replaced
// and never edited, so the input workspace is not mutated.
interface Draft {
  blocks: Record<BlockId, Block>;
  views: Record<ViewId, View>;
  rootIds: BlockId[];
  settings: Settings;
  readonly inverse: Operation[];
  readonly blockIds: Set<BlockId>;
  readonly viewIds: Set<ViewId>;
  hasMetaChange: boolean;
}

type Step = OperationError | undefined;

function createDraft(workspace: Workspace): Draft {
  return {
    blocks: { ...workspace.blocks },
    views: { ...workspace.views },
    rootIds: [...workspace.rootIds],
    settings: workspace.settings,
    inverse: [],
    blockIds: new Set(),
    viewIds: new Set(),
    hasMetaChange: false,
  };
}

// The values a patch replaces; a key the record lacked comes back as
// undefined, which removes it again when the inverse is applied.
function previousValues<TRecord extends object>(
  record: TRecord,
  patch: Partial<TRecord>,
): Partial<TRecord> {
  const previous: Partial<TRecord> = {};
  for (const key of Object.keys(patch)) {
    Object.assign(previous, { [key]: Reflect.get(record, key) });
  }
  return previous;
}

// The record with the patch applied; a key patched to undefined is left
// out, as a record that never had it.
function patched<TRecord extends object>(
  record: TRecord,
  patch: object,
): TRecord {
  const next = { ...record, ...patch };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) Reflect.deleteProperty(next, key);
  }
  return next;
}

function createRecord(
  draft: Draft,
  operation: Extract<Operation, { type: "record.create" }>,
): Step {
  const { id } = operation.record;
  if (operation.kind === "block") {
    if (draft.blocks[operation.record.id] !== undefined) {
      return { kind: "duplicate-record", id };
    }
    draft.blocks[operation.record.id] = operation.record;
    draft.blockIds.add(operation.record.id);
    draft.inverse.push({
      type: "record.delete",
      kind: "block",
      id: operation.record.id,
    });
    return undefined;
  }
  if (draft.views[operation.record.id] !== undefined) {
    return { kind: "duplicate-record", id };
  }
  draft.views[operation.record.id] = operation.record;
  draft.viewIds.add(operation.record.id);
  draft.inverse.push({
    type: "record.delete",
    kind: "view",
    id: operation.record.id,
  });
  return undefined;
}

function updateRecord(
  draft: Draft,
  operation: Extract<Operation, { type: "record.update" }>,
): Step {
  if (operation.kind === "settings") {
    const patch = previousValues(draft.settings, operation.patch);
    draft.settings = patched(draft.settings, operation.patch);
    draft.hasMetaChange = true;
    draft.inverse.push({ type: "record.update", kind: "settings", patch });
    return undefined;
  }
  if (operation.kind === "block") {
    const block = draft.blocks[operation.id];
    if (block === undefined)
      return { kind: "missing-record", id: operation.id };
    const patch = previousValues(block, operation.patch);
    draft.blocks[operation.id] = patched(block, operation.patch);
    draft.blockIds.add(operation.id);
    draft.inverse.push({ ...operation, patch });
    return undefined;
  }
  const view = draft.views[operation.id];
  if (view === undefined) return { kind: "missing-record", id: operation.id };
  const patch = previousValues(view, operation.patch);
  draft.views[operation.id] = patched(view, operation.patch);
  draft.viewIds.add(operation.id);
  draft.inverse.push({ ...operation, patch });
  return undefined;
}

function deleteRecord(
  draft: Draft,
  operation: Extract<Operation, { type: "record.delete" }>,
): Step {
  if (operation.kind === "block") {
    const { [operation.id]: record, ...rest } = draft.blocks;
    if (record === undefined)
      return { kind: "missing-record", id: operation.id };
    draft.blocks = rest;
    draft.blockIds.add(operation.id);
    draft.inverse.push({ type: "record.create", kind: "block", record });
    return undefined;
  }
  const { [operation.id]: record, ...rest } = draft.views;
  if (record === undefined) return { kind: "missing-record", id: operation.id };
  draft.views = rest;
  draft.viewIds.add(operation.id);
  draft.inverse.push({ type: "record.create", kind: "view", record });
  return undefined;
}

function readList(draft: Draft, list: ListRef): readonly BlockId[] | undefined {
  if (list.kind === "rootIds") return draft.rootIds;
  return draft.blocks[list.blockId]?.childIds;
}

function writeList(draft: Draft, list: ListRef, ids: BlockId[]): void {
  if (list.kind === "rootIds") {
    draft.rootIds = ids;
    draft.hasMetaChange = true;
    return;
  }
  const owner = draft.blocks[list.blockId];
  if (owner === undefined) return;
  draft.blocks[list.blockId] = { ...owner, childIds: ids };
  draft.blockIds.add(list.blockId);
}

function changeList(
  draft: Draft,
  operation: Extract<Operation, { type: "list.insert" | "list.remove" }>,
): Step {
  const { list, id } = operation;
  const ids = readList(draft, list);
  if (ids === undefined) {
    return {
      kind: "missing-record",
      id: list.kind === "childIds" ? list.blockId : id,
    };
  }
  draft.blockIds.add(id);
  if (operation.type === "list.insert") {
    const { index } = operation;
    if (index < 0 || index > ids.length)
      return { kind: "index-out-of-range", index };
    writeList(draft, list, ids.toSpliced(index, 0, id));
    draft.inverse.push({ type: "list.remove", list, id });
    return undefined;
  }
  const index = ids.indexOf(id);
  if (index === -1) return { kind: "missing-list-item", id };
  writeList(draft, list, ids.toSpliced(index, 1));
  draft.inverse.push({ type: "list.insert", list, id, index });
  return undefined;
}

function applyOne(draft: Draft, operation: Operation): Step {
  switch (operation.type) {
    case "record.create":
      return createRecord(draft, operation);
    case "record.update":
      return updateRecord(draft, operation);
    case "record.delete":
      return deleteRecord(draft, operation);
    case "list.insert":
    case "list.remove":
      return changeList(draft, operation);
  }
}

// Applies every operation or none: on the first error the input workspace
// is returned untouched by the caller, because nothing here mutates it.
export function applyOperations(
  workspace: Workspace,
  operations: readonly Operation[],
): ApplyResult {
  const draft = createDraft(workspace);
  for (const operation of operations) {
    const error = applyOne(draft, operation);
    if (error !== undefined) return { ok: false, error };
  }
  const { blocks, views, rootIds, settings, blockIds, viewIds } = draft;
  return {
    ok: true,
    workspace: { blocks, views, rootIds, settings },
    inverse: draft.inverse.toReversed(),
    changed: { blockIds, viewIds, hasMetaChange: draft.hasMetaChange },
  };
}
