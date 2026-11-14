import { describe, expect, it } from "vitest";
import {
  deletePage,
  selectPage,
  trashPage,
} from "../../../../blocks/page/index.ts";
import { createDatabaseApp, toPropertyId } from "../../database-builder.ts";
import { addProperty } from "../../database.commands.ts";
import { propertyType } from "../../property-registry.ts";
import { addRow } from "../../row.commands.ts";
import { numberExistingRows } from "../../row-numbering.ts";
import { toBlockId } from "../../../../model/index.ts";

function valuesOf(app: ReturnType<typeof createDatabaseApp>) {
  const state = app.store.getState();
  const propertyId = app.database().props.properties[0]?.id;
  if (propertyId === undefined) throw new Error("no property");
  return app
    .database()
    .childIds.map((id) => selectPage(state, id)?.props.values?.[propertyId]);
}

describe("the unique ID property", () => {
  it("numbers rows as they are added and never reuses a number", () => {
    const app = createDatabaseApp([{ name: "ID", type: "unique-id" }], []);
    const add = () =>
      app.dispatch(addRow.create({ databaseId: app.databaseId }));

    add();
    add();
    add();
    const last = app.database().childIds.at(-1);
    if (last === undefined) throw new Error("no row");
    app.dispatch(trashPage.create({ pageId: last }));
    app.dispatch(deletePage.create({ pageId: last }));
    add();

    expect(valuesOf(app)).toEqual([1, 2, 4]);
    expect(app.database().props.properties[0]?.config).toEqual({
      prefix: "",
      next: 5,
    });
  });

  it("numbers the rows a database has when the property is added", () => {
    const app = createDatabaseApp([], [["A"], ["B"]]);

    app.dispatch(
      addProperty.create({
        databaseId: app.databaseId,
        propertyType: "unique-id",
        name: "ID",
      }),
    );

    expect(valuesOf(app)).toEqual([1, 2]);
    expect(app.database().props.properties[0]?.config).toEqual({
      prefix: "",
      next: 3,
    });
  });

  it("shows the number after its prefix, and cannot be edited", () => {
    const type = propertyType("unique-id");
    const property = {
      id: toPropertyId("id"),
      name: "ID",
      type: "unique-id",
      config: { prefix: "TASK", next: 4 },
    };

    expect(type.renderCell(3, property)).toBe("TASK-3");
    expect(type.format(3, { ...property, config: undefined })).toBe("3");
    expect(type.editor).toBe("none");
  });

  it("numbers rows only, not a block that is not a row", () => {
    const app = createDatabaseApp([], [["A"], ["B"]]);
    const state = app.store.getState();
    const database = app.database();
    const stray = toBlockId("stray");
    const withStray = {
      ...state,
      workspace: {
        ...state.workspace,
        blocks: {
          ...state.workspace.blocks,
          [stray]: {
            id: stray,
            type: "paragraph",
            parentId: database.id,
            childIds: [],
            props: { text: [] },
            createdAt: "",
            updatedAt: "",
          },
        },
      },
    };
    const property = {
      id: toPropertyId("id"),
      name: "ID",
      type: "unique-id",
      config: { prefix: "", next: 1 },
    };

    const numbered = numberExistingRows(
      withStray,
      { ...database, childIds: [stray, ...database.childIds] },
      property,
    );

    expect(numbered.operations).toHaveLength(2);
    expect(numbered.property.config).toEqual({ prefix: "", next: 3 });
  });
});
