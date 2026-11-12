import { describe, expect, it } from "vitest";
import { selectDatabase } from "../../blocks/database/index.ts";
import { selectPage } from "../../blocks/page/index.ts";
import { parseWorkspaceFile, toBlockId } from "../../model/index.ts";
import { BLOCK_PROPS_SCHEMAS } from "../../blocks/index.ts";
import { createTestApp } from "../../state/index.ts";
import {
  addProperty,
  changeProperty,
  createDatabase,
  databaseCommands,
  removeProperty,
} from "./database.commands.ts";
import { COLUMN_MENU_OVERLAY } from "./database-overlay.ts";
import { addRow, rowCommands, setRowValue } from "./row.commands.ts";
import {
  createView,
  deleteView,
  resizeProperty,
  setActiveView,
  setViewSorts,
  togglePropertyHidden,
  viewCommands,
} from "./view.commands.ts";

const DB = toBlockId("new-1");
const ROW = toBlockId("new-2");

function createApp() {
  const app = createTestApp({
    commands: [...databaseCommands, ...rowCommands, ...viewCommands],
  });
  app.dispatch(createDatabase.create({ parentId: null }));
  const database = () => {
    const found = selectDatabase(app.store.getState(), DB);
    if (found === undefined) throw new Error("no database");
    return found;
  };
  const firstView = () => {
    const viewId = database().props.viewIds[0];
    const view =
      viewId === undefined
        ? undefined
        : app.store.getState().workspace.views[viewId];
    if (view === undefined) throw new Error("no view");
    return view;
  };
  return { ...app, database, firstView };
}

function withProperty(propertyType = "text") {
  const app = createApp();
  app.dispatch(
    addProperty.create({ databaseId: DB, propertyType, name: "Notes" }),
  );
  const propertyId = app.database().props.properties[0]?.id;
  if (propertyId === undefined) throw new Error("no property");
  return { ...app, propertyId };
}

describe("database commands", () => {
  it("opens a property's settings when asked, as Notion's + does", () => {
    const app = createApp();

    app.dispatch(
      addProperty.create({
        databaseId: DB,
        propertyType: "text",
        name: "Text",
        opensSettings: true,
      }),
    );

    const id = app.database().props.properties[0]?.id;
    expect(app.store.getState().ui.overlay).toEqual({
      kind: COLUMN_MENU_OVERLAY,
      anchorId: id,
      children: [{ anchorId: `${String(id)}:edit` }],
    });
  });

  it("creates a database with one table view and opens it", () => {
    const { store, database, firstView } = createApp();

    expect(store.getState().workspace.rootIds).toEqual([DB]);
    expect(store.getState().ui.activePageId).toBe(DB);
    expect(firstView()).toMatchObject({
      databaseId: DB,
      name: "Table",
      type: "table",
    });
    expect(database().props.properties).toEqual([]);
  });

  it("adds, renames and removes a property", () => {
    const { dispatch, database, propertyId } = withProperty("number");
    expect(database().props.properties).toMatchObject([
      { name: "Notes", type: "number" },
    ]);

    dispatch(
      changeProperty.create({ databaseId: DB, propertyId, name: "Amount" }),
    );
    expect(database().props.properties[0]?.name).toBe("Amount");
    dispatch(removeProperty.create({ databaseId: DB, propertyId }));

    expect(database().props.properties).toEqual([]);
  });

  it("describes a property, and an empty description removes it", () => {
    const { dispatch, database, propertyId } = withProperty("number");
    const describe = (description: string) =>
      dispatch(
        changeProperty.create({ databaseId: DB, propertyId, description }),
      );

    describe("  Hours spent so far ");
    expect(database().props.properties[0]?.description).toBe(
      "Hours spent so far",
    );
    describe(" ");

    expect(database().props.properties[0]).not.toHaveProperty("description");
  });

  it("adds a row as a page inside the database and starts editing its title", () => {
    const { store, dispatch, database } = createApp();

    dispatch(addRow.create({ databaseId: DB }));

    expect(database().childIds).toEqual([ROW]);
    expect(selectPage(store.getState(), ROW)?.parentId).toBe(DB);
    expect(store.getState().ui.activeCell).toEqual({
      rowId: ROW,
      propertyId: null,
      isEditing: true,
    });
  });

  it("sets and clears a cell value", () => {
    const { store, dispatch, propertyId } = withProperty();
    dispatch(addRow.create({ databaseId: DB }));

    dispatch(setRowValue.create({ rowId: ROW, propertyId, value: "hello" }));
    expect(selectPage(store.getState(), ROW)?.props.values).toEqual({
      [propertyId]: "hello",
    });
    dispatch(setRowValue.create({ rowId: ROW, propertyId, value: undefined }));

    expect(selectPage(store.getState(), ROW)?.props.values).toEqual({});
  });

  it("does not set a value on a page that is not a row", () => {
    const { store, dispatch, propertyId } = withProperty();
    const before = store.getState().workspace;

    dispatch(setRowValue.create({ rowId: DB, propertyId, value: 1 }));

    expect(store.getState().workspace).toBe(before);
  });

  it("writes a workspace that loads back without skipped records", () => {
    const { store, dispatch, propertyId } = withProperty();
    dispatch(addRow.create({ databaseId: DB }));
    dispatch(setRowValue.create({ rowId: ROW, propertyId, value: "kept" }));
    const stored = JSON.stringify({
      schemaVersion: 1,
      ...store.getState().workspace,
    });
    const file: unknown = JSON.parse(stored);

    const result = parseWorkspaceFile(file, BLOCK_PROPS_SCHEMAS);

    expect(result).toMatchObject({ ok: true, skipped: [] });
  });
});

describe("view commands", () => {
  it("adds a second view and shows it", () => {
    const { store, dispatch, database } = createApp();

    dispatch(createView.create({ databaseId: DB, name: "Done" }));

    expect(database().props.viewIds).toHaveLength(2);
    expect(store.getState().ui.activeViewIds[DB]).toBe(
      database().props.viewIds[1],
    );
  });

  it("deletes a view but never the last one", () => {
    const { dispatch, database, firstView } = createApp();
    dispatch(createView.create({ databaseId: DB, name: "Done" }));
    const first = firstView().id;

    dispatch(deleteView.create({ viewId: first }));
    expect(database().props.viewIds).toHaveLength(1);
    dispatch(
      deleteView.create({ viewId: database().props.viewIds[0] ?? first }),
    );

    expect(database().props.viewIds).toHaveLength(1);
  });

  it("keeps sort, width and hidden columns in the view record only", () => {
    const { store, dispatch, firstView, propertyId } = withProperty();
    const viewId = firstView().id;
    const databaseBefore = selectDatabase(store.getState(), DB);

    dispatch(
      setViewSorts.create({
        viewId,
        sorts: [{ propertyId, direction: "descending" }],
      }),
    );
    dispatch(resizeProperty.create({ viewId, propertyId, width: 240.4 }));
    dispatch(togglePropertyHidden.create({ viewId, propertyId }));

    expect(firstView()).toMatchObject({
      sorts: [{ propertyId, direction: "descending" }],
      propertyWidths: { [propertyId]: 240 },
      hiddenPropertyIds: [propertyId],
    });
    expect(selectDatabase(store.getState(), DB)).toBe(databaseBefore);
  });

  it("clamps a column width to its limits", () => {
    const { dispatch, firstView, propertyId } = withProperty();

    dispatch(
      resizeProperty.create({ viewId: firstView().id, propertyId, width: 5 }),
    );

    expect(firstView().propertyWidths[propertyId]).toBe(80);
  });

  it("switches the shown view without touching workspace data", () => {
    const { store, dispatch, firstView } = createApp();
    dispatch(createView.create({ databaseId: DB, name: "Done" }));
    const before = store.getState().workspace;

    dispatch(setActiveView.create({ databaseId: DB, viewId: firstView().id }));

    expect(store.getState().workspace).toBe(before);
    expect(store.getState().ui.activeViewIds[DB]).toBe(firstView().id);
  });
});
