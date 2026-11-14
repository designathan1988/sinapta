// Operations as they travel between clients through the server (ADR-0013):
// a change of a record carries the whole record, so the same schemas that
// read stored data read it, and the last writer of a record wins.
import * as v from "valibot";
import { blockSchema, type Block } from "./block.schema.ts";
import { blockIdSchema, viewIdSchema } from "./id.schema.ts";
import type { Operation } from "./operation.ts";
import { viewSchema, type View } from "./view.schema.ts";
import { settingsSchema, type Settings } from "./workspace.schema.ts";

const listSchema = v.variant("kind", [
  v.object({ kind: v.literal("rootIds") }),
  v.object({ kind: v.literal("childIds"), blockId: blockIdSchema }),
]);

const wireOperationSchema = v.union([
  v.object({
    type: v.literal("record.create"),
    kind: v.literal("block"),
    record: blockSchema,
  }),
  v.object({
    type: v.literal("record.create"),
    kind: v.literal("view"),
    record: viewSchema,
  }),
  v.object({
    type: v.literal("record.update"),
    kind: v.literal("block"),
    id: blockIdSchema,
    patch: v.omit(blockSchema, ["id"]),
  }),
  v.object({
    type: v.literal("record.update"),
    kind: v.literal("view"),
    id: viewIdSchema,
    patch: v.omit(viewSchema, ["id"]),
  }),
  v.object({
    type: v.literal("record.update"),
    kind: v.literal("settings"),
    patch: settingsSchema,
  }),
  v.object({
    type: v.literal("record.delete"),
    kind: v.literal("block"),
    id: blockIdSchema,
  }),
  v.object({
    type: v.literal("record.delete"),
    kind: v.literal("view"),
    id: viewIdSchema,
  }),
  v.object({
    type: v.literal("list.insert"),
    list: listSchema,
    id: blockIdSchema,
    index: v.pipe(v.number(), v.integer(), v.minValue(0)),
  }),
  v.object({
    type: v.literal("list.remove"),
    list: listSchema,
    id: blockIdSchema,
  }),
]);

const wireOperationsSchema = v.array(wireOperationSchema);

// Operations read from the server, or undefined when one is malformed.
export function parseWireOperations(
  json: unknown,
): readonly Operation[] | undefined {
  const result = v.safeParse(wireOperationsSchema, json);
  return result.success ? result.output : undefined;
}

export interface CurrentRecords {
  readonly block: (id: Block["id"]) => Block | undefined;
  readonly view: (id: View["id"]) => View | undefined;
  readonly settings: Settings;
}

function wholeUpdate(
  operation: Extract<Operation, { type: "record.update" }>,
  current: CurrentRecords,
): Operation | undefined {
  if (operation.kind === "settings") {
    return { ...operation, patch: current.settings };
  }
  if (operation.kind === "block") {
    const block = current.block(operation.id);
    if (block === undefined) return undefined;
    const { id, ...patch } = block;
    return { ...operation, patch };
  }
  const view = current.view(operation.id);
  if (view === undefined) return undefined;
  const { id, ...patch } = view;
  return { ...operation, patch };
}

// A transaction's operations as they travel: each update carries the whole
// record as the transaction left it; an update of a record the same
// transaction then deleted is left out.
export function toWireOperations(
  operations: readonly Operation[],
  current: CurrentRecords,
): readonly Operation[] {
  return operations.flatMap((operation) => {
    if (operation.type !== "record.update") return [operation];
    const whole = wholeUpdate(operation, current);
    return whole === undefined ? [] : [whole];
  });
}
