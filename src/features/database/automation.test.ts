import { describe, expect, it } from "vitest";
import { automationApp as setup, settled } from "./automation-builder.ts";
import { deleteAutomation, setAutomation } from "./automation.commands.ts";
import { addRow, setRowValue } from "./row.commands.ts";

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

  it("are deleted", () => {
    const { app, databaseId, automationId } = setup();

    app.dispatch(deleteAutomation.create({ databaseId, automationId }));

    expect(app.database().props.automations).toEqual([]);
  });
});
