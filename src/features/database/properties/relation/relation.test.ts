import { describe, expect, it } from "vitest";
import { selectDatabase } from "../../../../blocks/database/index.ts";
import {
  deletePage,
  renamePage,
  selectPage,
  trashPage,
} from "../../../../blocks/page/index.ts";
import { toBlockId, type BlockId } from "../../../../model/index.ts";
import { selectCellContext } from "../../cell-context.selectors.ts";
import { createDatabaseApp } from "../../database-builder.ts";
import { createDatabase } from "../../database.commands.ts";
import { propertyType } from "../../property-registry.ts";
import { addRow } from "../../row.commands.ts";
import { setRelationTarget, setRelationValue } from "./relation.commands.ts";

// Tasks (this database) relate to Projects (another database).
function createApp() {
  const app = createDatabaseApp(
    [{ name: "Project", type: "relation" }],
    [["Write"], ["Ship"]],
  );
  app.dispatch(createDatabase.create({ parentId: null }));
  const projects = app.store.getState().ui.activePageId;
  if (projects === null) throw new Error("no second database");
  const addProject = (title: string): BlockId => {
    app.dispatch(addRow.create({ databaseId: projects }));
    const id = selectDatabase(app.store.getState(), projects)?.childIds.at(-1);
    if (id === undefined) throw new Error("no row");
    app.dispatch(renamePage.create({ pageId: id, title }));
    return id;
  };
  const alpha = addProject("Alpha");
  const beta = addProject("Beta");
  const [project] = app.propertyIds;
  const [write, ship] = app.rowIds;
  if (project === undefined || write === undefined || ship === undefined) {
    throw new Error("setup");
  }
  app.dispatch(
    setRelationTarget.create({
      databaseId: app.databaseId,
      propertyId: project,
      targetId: projects,
      isTwoWay: true,
    }),
  );
  const valueOf = (rowId: BlockId, propertyId: string) =>
    selectPage(app.store.getState(), rowId)?.props.values?.[propertyId];
  const inverse = () =>
    selectDatabase(app.store.getState(), projects)?.props.properties[0];
  const relate = (rowId: BlockId, value: BlockId[]) =>
    app.dispatch(
      setRelationValue.create({ rowId, propertyId: project, value }),
    );
  return {
    ...app,
    projects,
    alpha,
    beta,
    project,
    write,
    ship,
    valueOf,
    inverse,
    relate,
  };
}

describe("the relation property", () => {
  it("makes an inverse property on the other database", () => {
    const app = createApp();

    expect(app.inverse()).toMatchObject({
      type: "relation",
      config: {
        databaseId: app.databaseId,
        isTwoWay: true,
        inversePropertyId: app.project,
      },
    });
    expect(app.database().props.properties[0]?.config).toEqual({
      databaseId: app.projects,
      isTwoWay: true,
      inversePropertyId: app.inverse()?.id,
    });
  });

  it("shows a relation on the related page's inverse", () => {
    const app = createApp();
    const inverseId = app.inverse()?.id ?? "";

    app.relate(app.write, [app.alpha, app.beta]);
    app.relate(app.ship, [app.alpha]);

    expect(app.valueOf(app.alpha, inverseId)).toEqual([app.write, app.ship]);
    expect(app.valueOf(app.beta, inverseId)).toEqual([app.write]);
  });

  it("drops a removed page from both sides in one step", () => {
    const app = createApp();
    const inverseId = app.inverse()?.id ?? "";
    app.relate(app.write, [app.alpha, app.beta]);
    const before = app.store.getState().workspace;

    app.relate(app.write, [app.beta]);

    expect(app.valueOf(app.write, app.project)).toEqual([app.beta]);
    expect(app.valueOf(app.alpha, inverseId)).toBeUndefined();
    app.dispatch({ type: "history.undo" });
    expect(app.store.getState().workspace).toEqual(before);
  });

  it("hides a trashed related page and forgets a deleted one", () => {
    const app = createApp();
    app.relate(app.write, [app.alpha, app.beta]);
    const property = app.database().props.properties[0];
    if (property === undefined) throw new Error("no relation");
    const shown = () =>
      propertyType("relation").format(
        app.valueOf(app.write, app.project),
        property,
        selectCellContext(app.store.getState()),
      );

    app.dispatch(trashPage.create({ pageId: app.beta }));
    expect(shown()).toBe("Alpha");
    app.dispatch(deletePage.create({ pageId: app.beta }));

    expect(app.valueOf(app.write, app.project)).toEqual([app.alpha]);
  });

  it("turns into text with the titles when the related database is deleted", () => {
    const app = createApp();
    app.relate(app.write, [app.alpha, app.beta]);

    app.dispatch(trashPage.create({ pageId: app.projects }));
    app.dispatch(deletePage.create({ pageId: app.projects }));

    expect(app.database().props.properties[0]).toMatchObject({
      id: app.project,
      type: "text",
    });
    expect(app.database().props.properties[0]).not.toHaveProperty("config");
    expect(app.valueOf(app.write, app.project)).toBe("Alpha, Beta");
    expect(app.valueOf(app.ship, app.project)).toBeUndefined();
  });

  it("refuses rows that are not in the related database", () => {
    const app = createApp();

    app.relate(app.write, [app.alpha, app.ship, toBlockId("missing")]);

    expect(app.valueOf(app.write, app.project)).toEqual([app.alpha]);
  });
});

describe("a one-way relation", () => {
  it("keeps no inverse property on the other database", () => {
    const app = createApp();

    app.dispatch(
      setRelationTarget.create({
        databaseId: app.databaseId,
        propertyId: app.project,
        targetId: app.projects,
        isTwoWay: false,
      }),
    );
    app.relate(app.write, [app.alpha]);

    expect(app.inverse()).toBeUndefined();
    expect(app.database().props.properties[0]?.config).toMatchObject({
      databaseId: app.projects,
      isTwoWay: false,
    });
    expect(app.valueOf(app.write, app.project)).toEqual([app.alpha]);
  });
});
