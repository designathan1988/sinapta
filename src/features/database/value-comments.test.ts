import { describe, expect, it } from "vitest";
import { selectPage } from "../../blocks/page/index.ts";
import {
  commentCommands,
  selectValueDiscussionCount,
  startDiscussion,
  valueDiscussionTidier,
} from "../comments/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { removeProperty } from "./database.commands.ts";

function createApp() {
  const app = createDatabaseApp(
    [
      { name: "Amount", type: "number" },
      { name: "Note", type: "text" },
    ],
    [["Salary", 3500, "monthly"]],
    { commands: commentCommands, tidiers: [valueDiscussionTidier] },
  );
  const [rowId] = app.rowIds;
  const [amount, note] = app.propertyIds;
  if (rowId === undefined || amount === undefined || note === undefined)
    throw new Error("setup");
  const discussions = () =>
    selectPage(app.store.getState(), rowId)?.props.discussions ?? [];
  return { ...app, rowId, amount, note, discussions };
}

describe("discussions about a row's property value", () => {
  it("keep the property and the value as it read", () => {
    const app = createApp();

    app.dispatch(
      startDiscussion.create({
        pageId: app.rowId,
        blockId: null,
        value: { propertyId: app.amount, quote: "3500" },
        text: "Before tax?",
      }),
    );

    expect(app.discussions()).toEqual([
      expect.objectContaining({
        blockId: null,
        propertyId: app.amount,
        quote: "3500",
        isResolved: false,
      }),
    ]);
    const state = app.store.getState();
    expect(selectValueDiscussionCount(state, app.rowId, app.amount)).toBe(1);
    expect(selectValueDiscussionCount(state, app.rowId, app.note)).toBe(0);
  });

  it("go with their property, in the same undo step", () => {
    const app = createApp();
    const about = (propertyId: typeof app.amount, text: string) =>
      startDiscussion.create({
        pageId: app.rowId,
        blockId: null,
        value: { propertyId, quote: "x" },
        text,
      });
    app.dispatch(about(app.amount, "On the amount"));
    app.dispatch(about(app.note, "On the note"));

    app.dispatch(
      removeProperty.create({
        databaseId: app.databaseId,
        propertyId: app.amount,
      }),
    );

    expect(app.discussions().map((item) => item.propertyId)).toEqual([
      app.note,
    ]);
    app.dispatch({ type: "history.undo" });
    expect(app.discussions()).toHaveLength(2);
  });
});
