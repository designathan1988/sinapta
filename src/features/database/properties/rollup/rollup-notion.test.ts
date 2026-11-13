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
import { addRow } from "../../row.commands.ts";
import { selectTableModel } from "../../table-model.selectors.ts";
import { setViewFilter } from "../../view.commands.ts";
import { setRelationTarget, setRelationValue } from "../relation/index.ts";

// The rows Notion kept on 2026-11-13 (n68-rollup-filters): A1 relates to
// numbers 5 and 10, A2 to 20, A3 to none; the rollup shows them, and the
// condition is "> 8".
function numbersApp() {
  const app = createDatabaseApp(
    [{ name: "Number", type: "number" }],
    [
      ["C5", 5],
      ["C10", 10],
      ["C20", 20],
    ],
  );
  const [number] = app.propertyIds;
  app.dispatch(createDatabase.create({ parentId: null }));
  const holder = app.store.getState().ui.activePageId;
  if (holder === null || number === undefined) throw new Error("setup");
  const add = (type: string, name: string): PropertyId => {
    app.dispatch(
      addProperty.create({ databaseId: holder, propertyType: type, name }),
    );
    const id = selectDatabase(
      app.store.getState(),
      holder,
    )?.props.properties.at(-1)?.id;
    if (id === undefined) throw new Error("no property");
    return id;
  };
  const relation = add("relation", "Related");
  const rollup = add("rollup", "Rollup 1");
  app.dispatch(
    setRelationTarget.create({
      databaseId: holder,
      propertyId: relation,
      targetId: app.databaseId,
      isTwoWay: false,
    }),
  );
  const [c5, c10, c20] = app.rowIds;
  const links: Record<string, readonly (BlockId | undefined)[]> = {
    A1: [c5, c10],
    A2: [c20],
    A3: [],
  };
  for (const [title, related] of Object.entries(links)) {
    app.dispatch(addRow.create({ databaseId: holder }));
    const row = selectDatabase(app.store.getState(), holder)?.childIds.at(-1);
    if (row === undefined) throw new Error("no row");
    app.dispatch(renamePage.create({ pageId: row, title }));
    const value = related.flatMap((id) => (id === undefined ? [] : [id]));
    app.dispatch(
      setRelationValue.create({ rowId: row, propertyId: relation, value }),
    );
  }
  const config = {
    relationPropertyId: relation,
    targetPropertyId: number,
    function: "show-original",
  };
  app.dispatch(
    setPropertyConfig.create({
      databaseId: holder,
      propertyId: rollup,
      config,
    }),
  );
  return (operator: string): string[] => {
    const viewId = selectTableModel(app.store.getState(), holder)?.view.id;
    if (viewId === undefined) throw new Error("no view");
    const filter = {
      conjunction: "and" as const,
      items: [{ propertyId: rollup, operator, value: "8" }],
    };
    app.dispatch(setViewFilter.create({ viewId, filter }));
    return (selectTableModel(app.store.getState(), holder)?.rows ?? []).map(
      (row) => row.title,
    );
  };
}

describe("a rollup's Any, None and Every, as Notion kept rows", () => {
  it("keeps for > 8 the rows Notion kept", () => {
    const kept = numbersApp();

    expect(kept("any:greater-than")).toEqual(["A1", "A2"]);
    // A row with no related value passes None and fails Every, as Notion's.
    expect(kept("none:greater-than")).toEqual(["A3"]);
    expect(kept("every:greater-than")).toEqual(["A2"]);
  });
});
