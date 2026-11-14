import { describe, expect, it } from "vitest";
import { isPageLike } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import { installAutomations } from "./automation-runner.ts";
import {
  addAutomation,
  deleteAutomation,
  setAutomation,
} from "./automation.commands.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { addRow, setRowValue } from "./row.commands.ts";

async function settled(): Promise<void> {
  for (let turn = 0; turn < 3; turn += 1) await Promise.resolve();
}

// A database with a Stage select and a Done checkbox, one row, and an
// automation the runner watches.
function setup() {
  const app = createDatabaseApp(
    [
      {
        name: "Stage",
        type: "select",
        options: [{ id: "new", name: "New", color: "gray" }],
      },
      { name: "Done", type: "checkbox" },
    ],
    [["First", "", false]],
  );
  const [stage, done] = app.propertyIds;
  const [first] = app.rowIds;
  if (stage === undefined || done === undefined || first === undefined)
    throw new Error("setup");
  installAutomations(app.store, app.dispatch);
  const { databaseId } = app;
  app.dispatch(addAutomation.create({ databaseId }));
  const automationId = app.database().props.automations?.[0]?.id ?? "";
  const valueOf = (rowId: BlockId | undefined, propertyId: string) => {
    const row =
      rowId === undefined
        ? undefined
        : app.store.getState().workspace.blocks[rowId];
    return row !== undefined && isPageLike(row)
      ? row.props.values?.[propertyId]
      : undefined;
  };
  return { app, stage, done, first, databaseId, automationId, valueOf };
}

describe("a database's automations, as Notion's", () => {
  it("are added on, When a page is added, setting nothing yet", () => {
    const { app } = setup();

    expect(app.database().props.automations).toEqual([
      expect.objectContaining({
        isActive: true,
        trigger: { kind: "page-added" },
        values: {},
      }),
    ]);
  });

  it("set a new page's Stage when it is added", async () => {
    const { app, stage, databaseId, automationId, valueOf } = setup();
    const values = { [stage]: "new" };
    app.dispatch(
      setAutomation.create({ databaseId, automationId, patch: { values } }),
    );

    app.dispatch(addRow.create({ databaseId }));
    await settled();

    expect(valueOf(app.database().childIds.at(-1), stage)).toBe("new");
  });

  it("set a value when another property is edited, and not when off", async () => {
    const { app, stage, done, first, databaseId, automationId, valueOf } =
      setup();
    const trigger = { kind: "property-edited", propertyId: done } as const;
    const values = { [stage]: "new" };
    app.dispatch(
      setAutomation.create({
        databaseId,
        automationId,
        patch: { trigger, values },
      }),
    );

    app.dispatch(
      setRowValue.create({ rowId: first, propertyId: done, value: true }),
    );
    await settled();
    const ran = valueOf(first, stage);
    app.dispatch(
      setAutomation.create({
        databaseId,
        automationId,
        patch: { isActive: false },
      }),
    );
    app.dispatch(
      setRowValue.create({ rowId: first, propertyId: stage, value: "" }),
    );
    app.dispatch(
      setRowValue.create({ rowId: first, propertyId: done, value: false }),
    );
    await settled();

    expect(ran).toBe("new");
    expect(valueOf(first, stage)).toBe("");
  });

  it("run as a step of their own, which one undo takes back", async () => {
    const { app, stage, databaseId, automationId, valueOf } = setup();
    const values = { [stage]: "new" };
    app.dispatch(
      setAutomation.create({ databaseId, automationId, patch: { values } }),
    );
    app.dispatch(addRow.create({ databaseId }));
    await settled();
    const added = app.database().childIds.at(-1);

    app.dispatch({ type: "history.undo" });
    await settled();

    expect(app.database().childIds).toContain(added);
    expect(valueOf(added, stage)).toBeUndefined();
  });

  it("add a page to the database they name, and stop once cleared", async () => {
    const { app, stage, databaseId, automationId } = setup();
    const trigger = { kind: "property-edited", propertyId: stage } as const;
    const patch = { trigger, addPageTo: databaseId };
    app.dispatch(setAutomation.create({ databaseId, automationId, patch }));
    const before = app.database().childIds.length;
    const [first] = app.rowIds;
    if (first === undefined) throw new Error("setup");

    app.dispatch(
      setRowValue.create({ rowId: first, propertyId: stage, value: "new" }),
    );
    await settled();
    const added = app.database().childIds.length - before;
    app.dispatch(
      setAutomation.create({
        databaseId,
        automationId,
        patch: { addPageTo: "" },
      }),
    );

    expect(added).toBe(1);
    expect(app.database().props.automations?.[0]).not.toHaveProperty(
      "addPageTo",
    );
  });

  it("are deleted", () => {
    const { app, databaseId, automationId } = setup();

    app.dispatch(deleteAutomation.create({ databaseId, automationId }));

    expect(app.database().props.automations).toEqual([]);
  });
});
