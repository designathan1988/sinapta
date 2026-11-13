import { describe, expect, it } from "vitest";
import { selectDatabase } from "../../../../blocks/database/index.ts";
import { renamePage } from "../../../../blocks/page/index.ts";
import type { BlockId, PropertyId } from "../../../../model/index.ts";
import { createDatabaseApp } from "../../database-builder.ts";
import {
  addProperty,
  createDatabase,
  setPropertyConfig,
} from "../../database.commands.ts";
import { operatorsOf } from "../../filter-operators.ts";
import { addRow } from "../../row.commands.ts";
import { selectTableModel } from "../../table-model.selectors.ts";
import { setViewFilter } from "../../view.commands.ts";
import { setRelationTarget, setRelationValue } from "../relation/index.ts";

const STAGES = [
  { id: "todo", name: "To-do", color: "gray" },
  { id: "done", name: "Done", color: "green" },
];

// Tasks with a stage and a note, and projects relating to some of them:
// Alpha to two done tasks, Beta to a done and a to-do task, Gamma none.
function createApp() {
  const app = createDatabaseApp(
    [
      { name: "Stage", type: "select", options: STAGES },
      { name: "Note", type: "text" },
    ],
    [
      ["T1", "done", "ship it"],
      ["T2", "done", "review"],
      ["T3", "todo", "ship later"],
    ],
  );
  const [stage, note] = app.propertyIds;
  app.dispatch(createDatabase.create({ parentId: null }));
  const projects = app.store.getState().ui.activePageId;
  if (projects === null || stage === undefined || note === undefined)
    throw new Error("no projects");
  const add = (type: string, name: string): PropertyId => {
    app.dispatch(
      addProperty.create({ databaseId: projects, propertyType: type, name }),
    );
    const id = selectDatabase(
      app.store.getState(),
      projects,
    )?.props.properties.at(-1)?.id;
    if (id === undefined) throw new Error("no property");
    return id;
  };
  const relation = add("relation", "Tasks");
  const rollup = add("rollup", "Stages");
  app.dispatch(
    setRelationTarget.create({
      databaseId: projects,
      propertyId: relation,
      targetId: app.databaseId,
      isTwoWay: false,
    }),
  );
  const [t1, t2, t3] = app.rowIds;
  const rows: Record<string, readonly (BlockId | undefined)[]> = {
    Alpha: [t1, t2],
    Beta: [t1, t3],
    Gamma: [],
  };
  for (const [title, related] of Object.entries(rows)) {
    app.dispatch(addRow.create({ databaseId: projects }));
    const row = selectDatabase(app.store.getState(), projects)?.childIds.at(-1);
    if (row === undefined) throw new Error("no row");
    app.dispatch(renamePage.create({ pageId: row, title }));
    const value = related.flatMap((id) => (id === undefined ? [] : [id]));
    app.dispatch(
      setRelationValue.create({ rowId: row, propertyId: relation, value }),
    );
  }
  const rollTo = (targetPropertyId: string) => {
    const config = {
      relationPropertyId: relation,
      targetPropertyId,
      function: "show-original",
    };
    app.dispatch(
      setPropertyConfig.create({
        databaseId: projects,
        propertyId: rollup,
        config,
      }),
    );
  };
  // The titles a projects view keeps under one condition on the rollup.
  const kept = (operator: string, value: string): string[] => {
    const viewId = selectTableModel(app.store.getState(), projects)?.view.id;
    if (viewId === undefined) throw new Error("no view");
    const filter = {
      conjunction: "and" as const,
      items: [{ propertyId: rollup, operator, value }],
    };
    app.dispatch(setViewFilter.create({ viewId, filter }));
    return (selectTableModel(app.store.getState(), projects)?.rows ?? []).map(
      (row) => row.title,
    );
  };
  const rollupProperty = () =>
    selectDatabase(app.store.getState(), projects)?.props.properties.find(
      (item) => item.id === rollup,
    );
  return { ...app, stage, note, rollTo, kept, rollupProperty };
}

describe("a rollup's filter conditions", () => {
  it("asks its target's conditions of Any, None or Every related value", () => {
    const app = createApp();
    app.rollTo(app.stage);

    const ids = operatorsOf(app.rollupProperty(), app.store.getState())
      .filter((item) => item.isRetired !== true)
      .map((item) => item.id);

    expect(ids.slice(0, 2)).toEqual(["any:is", "any:is-not"]);
    expect(ids).toContain("none:is-empty");
    expect(ids).toContain("every:is");
  });

  it("keeps a row when every related value is Done, and drops one with a To-do", () => {
    const app = createApp();
    app.rollTo(app.stage);

    expect(app.kept("every:is", "done")).toEqual(["Alpha", "Gamma"]);
    expect(app.kept("any:is", "todo")).toEqual(["Beta"]);
  });

  it("keeps a row when no related text contains the operand", () => {
    const app = createApp();
    app.rollTo(app.note);

    expect(app.kept("none:contains", "later")).toEqual(["Alpha", "Gamma"]);
    expect(app.kept("any:contains", "ship")).toEqual(["Alpha", "Beta"]);
  });

  it("offers no condition while it follows no relation", () => {
    const app = createApp();

    const offered = operatorsOf(
      app.rollupProperty(),
      app.store.getState(),
    ).filter((item) => item.isRetired !== true);

    expect(offered).toEqual([]);
  });
});
