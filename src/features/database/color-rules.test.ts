import { describe, expect, it } from "vitest";
import { UNDO_COMMAND } from "../../state/index.ts";
import {
  addColorRule,
  deleteColorRule,
  setColorRule,
} from "./color-rules.commands.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { removeProperty } from "./database.commands.ts";

function createApp() {
  return createDatabaseApp(
    [
      { name: "Due", type: "date" },
      { name: "Notes", type: "text" },
    ],
    [["Ship"]],
  );
}

describe("a view's conditional color rules", () => {
  it("adds a red rule with no condition, sets it, deletes it and undoes", () => {
    const app = createApp();
    const viewId = app.view().id;
    const rules = () => app.view().colorRules ?? [];

    app.dispatch(addColorRule.create({ viewId }));
    const [rule] = rules();
    expect(rule).toMatchObject({
      color: "red",
      target: "background",
      filter: { conjunction: "and", items: [] },
    });
    if (rule === undefined) throw new Error("no rule");

    app.dispatch(
      setColorRule.create({
        viewId,
        ruleId: rule.id,
        patch: { color: "blue", target: "text" },
      }),
    );
    expect(rules()[0]).toMatchObject({ color: "blue", target: "text" });

    app.dispatch(deleteColorRule.create({ viewId, ruleId: rule.id }));
    expect(rules()).toEqual([]);

    app.dispatch({ type: UNDO_COMMAND });
    expect(rules()[0]).toMatchObject({ color: "blue" });
  });

  it("drops a rule left with no condition when its property goes", () => {
    const app = createApp();
    const viewId = app.view().id;
    const [due, notes] = app.propertyIds;
    if (due === undefined || notes === undefined) throw new Error("setup");
    app.dispatch(addColorRule.create({ viewId }));
    app.dispatch(addColorRule.create({ viewId }));
    const [onDue, onBoth] = app.view().colorRules ?? [];
    if (onDue === undefined || onBoth === undefined) throw new Error("setup");
    const condition = (propertyId: typeof due) => ({
      propertyId,
      operator: "is-not-empty",
      value: "",
    });
    const set = (ruleId: string, items: ReturnType<typeof condition>[]) =>
      app.dispatch(
        setColorRule.create({
          viewId,
          ruleId,
          patch: { filter: { conjunction: "and", items } },
        }),
      );
    set(onDue.id, [condition(due)]);
    set(onBoth.id, [condition(due), condition(notes)]);

    app.dispatch(
      removeProperty.create({ databaseId: app.databaseId, propertyId: due }),
    );

    expect(app.view().colorRules).toEqual([
      { ...onBoth, filter: { conjunction: "and", items: [condition(notes)] } },
    ]);
  });
});
