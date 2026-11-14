import { describe, expect, it } from "vitest";
import {
  applyOperations,
  buildWorkspace,
  parseWireOperations,
  toBlockId,
  toWireOperations,
  type Operation,
} from "../model/index.ts";
import { withLogged } from "./sync-outbox.ts";
import { currentRecords } from "./sync-records.ts";

const AT = "2026-11-14T00:00:00.000Z";
const BOX = toBlockId("box");
const CHILD = toBlockId("child");

// A block made into a container in one transaction, as turning a line
// into a synced block does: the block changed, its first child made and
// put in it.
const BEFORE = buildWorkspace([
  {
    id: "page",
    children: [{ id: "box", type: "paragraph", props: { text: [] } }],
  },
]);
const TRANSACTION: Operation[] = [
  {
    type: "record.update",
    kind: "block",
    id: BOX,
    patch: { type: "synced-block", props: {} },
  },
  {
    type: "record.create",
    kind: "block",
    record: {
      id: CHILD,
      type: "paragraph",
      parentId: BOX,
      childIds: [],
      props: { text: [{ text: "Shared words" }] },
      createdAt: AT,
      updatedAt: AT,
    },
  },
  {
    type: "list.insert",
    list: { kind: "childIds", blockId: BOX },
    id: CHILD,
    index: 0,
  },
];

function applied() {
  const result = applyOperations(BEFORE, TRANSACTION);
  if (!result.ok) throw new Error("the transaction failed");
  return result.workspace;
}

describe("a transaction as it travels", () => {
  it("carries the changed block's children as the update left them, so the child is not listed twice", () => {
    const wire = toWireOperations(TRANSACTION, currentRecords(applied()));
    const replayed = applyOperations(BEFORE, wire);

    expect(wire[0]).toMatchObject({ patch: { childIds: [] } });
    expect(replayed.ok && replayed.workspace.blocks[BOX]?.childIds).toEqual([
      CHILD,
    ]);
  });
});

describe("loading the logged transactions", () => {
  it("skips one that would list a child twice, and keeps the ones after it", () => {
    const broken = TRANSACTION.map((operation) =>
      operation.type === "record.update"
        ? { ...operation, patch: { ...applied().blocks[BOX] } }
        : operation,
    );
    const later: Operation[] = [
      {
        type: "record.update",
        kind: "block",
        id: toBlockId("page"),
        patch: {
          ...BEFORE.blocks[toBlockId("page")],
          props: { title: [{ text: "Still here" }] },
        },
      },
    ];

    const loaded = withLogged(BEFORE, [
      { seq: 1, clientId: "a", operations: broken },
      { seq: 2, clientId: "a", operations: later },
    ]);

    expect(parseWireOperations(broken)).toBeDefined();
    expect(loaded.workspace.blocks[BOX]?.childIds).toEqual([]);
    expect(loaded.workspace.blocks[toBlockId("page")]?.props).toMatchObject({
      title: [{ text: "Still here" }],
    });
    expect(loaded.seq).toBe(2);
  });
});
