import { describe, expect, it } from "vitest";
import { selectDatabase } from "../../blocks/database/index.ts";
import {
  addDataSource,
  linkDataSource,
  setViewSource,
  unlinkDataSource,
} from "./data-source.commands.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { addRow } from "./row.commands.ts";
import { selectTableModel } from "./table-model.selectors.ts";

// A database with one row, and a data source made beside it with two.
function setup() {
  const app = createDatabaseApp([], [["Own row"]]);
  const { databaseId } = app;
  app.dispatch(addDataSource.create({ databaseId }));
  const sourceId = app.database().props.sourceIds?.[0];
  if (sourceId === undefined) throw new Error("setup");
  app.dispatch(addRow.create({ databaseId: sourceId, title: "Source one" }));
  app.dispatch(addRow.create({ databaseId: sourceId, title: "Source two" }));
  const titles = () =>
    selectTableModel(app.store.getState(), databaseId)?.rows.map(
      (row) => row.title,
    );
  return { app, databaseId, sourceId, titles };
}

describe("a database's data sources, as Notion's", () => {
  it("adds a new source beside the database, named New data source", () => {
    const { app, databaseId, sourceId } = setup();
    const state = app.store.getState();
    const source = selectDatabase(state, sourceId);
    const parent = state.workspace.rootIds;

    expect(source?.props.title).toEqual([{ text: "New data source" }]);
    expect(source?.props.sourceOf).toBe(databaseId);
    expect(parent.indexOf(sourceId)).toBe(parent.indexOf(databaseId) + 1);
  });

  it("shows a source's rows in a view that chooses it, and its own again", () => {
    const { app, sourceId, titles } = setup();
    const viewId = app.view().id;
    const own = titles();

    app.dispatch(setViewSource.create({ viewId, sourceId }));
    const shown = titles();
    app.dispatch(setViewSource.create({ viewId, sourceId: null }));

    expect(own).toEqual(["Own row"]);
    expect(shown).toEqual(["Source one", "Source two"]);
    expect(titles()).toEqual(["Own row"]);
  });

  it("links an existing database once, and never the database itself", () => {
    const { app, databaseId, sourceId } = setup();

    app.dispatch(linkDataSource.create({ databaseId, sourceId }));
    app.dispatch(linkDataSource.create({ databaseId, sourceId: databaseId }));

    expect(app.database().props.sourceIds).toEqual([sourceId]);
  });

  it("unlinks a source and puts its views back on the database's rows", () => {
    const { app, databaseId, sourceId, titles } = setup();
    const viewId = app.view().id;
    app.dispatch(setViewSource.create({ viewId, sourceId }));

    app.dispatch(unlinkDataSource.create({ databaseId, sourceId }));

    const source = selectDatabase(app.store.getState(), sourceId);
    expect(app.database().props.sourceIds).toEqual([]);
    expect(app.view().sourceId).toBeUndefined();
    expect(source?.props).not.toHaveProperty("sourceOf");
    expect(titles()).toEqual(["Own row"]);
  });
});
