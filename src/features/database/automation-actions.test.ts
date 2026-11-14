import { describe, expect, it } from "vitest";
import { isPageLike } from "../../blocks/page/index.ts";
import { automationApp as setup, settled } from "./automation-builder.ts";
import { selectSlackText, selectWebhook } from "./automation-runs.selectors.ts";
import { setAutomation } from "./automation.commands.ts";
import { addRow, setRowValue } from "./row.commands.ts";

describe("a database automation's actions, as Notion's", () => {
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

  it("post a page's title and values by name with Send webhook", () => {
    const { app, stage, first, databaseId, automationId } = setup();
    const patch = { webhookUrl: "https://hooks.example.com/in" };
    app.dispatch(setAutomation.create({ databaseId, automationId, patch }));
    app.dispatch(
      setRowValue.create({ rowId: first, propertyId: stage, value: "new" }),
    );

    const webhook = selectWebhook(app.store.getState(), {
      databaseId,
      automationId,
      rowId: first,
      adds: 0,
    });

    expect(webhook).toEqual({
      url: "https://hooks.example.com/in",
      payload: {
        source: { type: "automation", automation_id: automationId },
        data: {
          object: "page",
          id: first,
          title: "First",
          properties: { Stage: "new", Done: false },
        },
      },
    });
  });

  it("take Send webhook off with an empty address", () => {
    const { app, databaseId, automationId } = setup();
    const url = "https://hooks.example.com/in";
    app.dispatch(
      setAutomation.create({
        databaseId,
        automationId,
        patch: { webhookUrl: url },
      }),
    );

    app.dispatch(
      setAutomation.create({
        databaseId,
        automationId,
        patch: { webhookUrl: "" },
      }),
    );

    expect(app.database().props.automations?.[0]).not.toHaveProperty(
      "webhookUrl",
    );
  });

  it("say in Slack what set them off, once switched on", () => {
    const { app, first, databaseId, automationId } = setup();
    const run = { databaseId, automationId, rowId: first, adds: 0 };
    const off = selectSlackText(app.store.getState(), run);

    app.dispatch(
      setAutomation.create({
        databaseId,
        automationId,
        patch: { sendsSlack: true },
      }),
    );

    expect(off).toBeUndefined();
    expect(selectSlackText(app.store.getState(), run)).toBe(
      "First in Untitled database: Page added",
    );
  });

  it("leave a notice on the page for each person they notify", async () => {
    const { app, databaseId, automationId } = setup();
    const patch = { notifyUserIds: ["ada", "bia"] };
    app.dispatch(setAutomation.create({ databaseId, automationId, patch }));

    app.dispatch(addRow.create({ databaseId }));
    await settled();

    const added = app.database().childIds.at(-1);
    const row =
      added === undefined
        ? undefined
        : app.store.getState().workspace.blocks[added];
    const notices =
      row !== undefined && isPageLike(row) ? row.props.automationNotices : [];
    expect(notices?.map((notice) => [notice.userId, notice.text])).toEqual([
      ["ada", "Automation in Untitled database: Page added"],
      ["bia", "Automation in Untitled database: Page added"],
    ]);
  });
});
