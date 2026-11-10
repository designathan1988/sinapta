import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "./database-builder.ts";
import { renameView, sortByProperty } from "./view.commands.ts";

function createApp() {
  const app = createDatabaseApp(
    [
      { name: "Points", type: "number" },
      { name: "Notes", type: "text" },
    ],
    [],
  );
  const [points, notes] = app.propertyIds;
  if (points === undefined || notes === undefined) throw new Error("setup");
  const sortBy = (
    propertyId: typeof points,
    direction: "ascending" | "descending" | null,
    keepOthers: boolean,
  ) => {
    app.dispatch(
      sortByProperty.create({
        viewId: app.view().id,
        propertyId,
        direction,
        keepOthers,
      }),
    );
  };
  return { ...app, points, notes, sortBy };
}

describe("view commands", () => {
  it("renames a view", () => {
    const { dispatch, view } = createApp();

    dispatch(renameView.create({ viewId: view().id, name: "Backlog" }));

    expect(view().name).toBe("Backlog");
  });

  it("replaces the sorts of a view when the others are not kept", () => {
    const { view, points, notes, sortBy } = createApp();

    sortBy(points, "ascending", false);
    sortBy(notes, "descending", false);

    expect(view().sorts).toEqual([
      { propertyId: notes, direction: "descending" },
    ]);
  });

  it("adds a second sort after the first when the others are kept", () => {
    const { view, points, notes, sortBy } = createApp();

    sortBy(points, "ascending", false);
    sortBy(notes, "descending", true);

    expect(view().sorts).toEqual([
      { propertyId: points, direction: "ascending" },
      { propertyId: notes, direction: "descending" },
    ]);
  });

  it("changes the direction of a sort without moving it in the order", () => {
    const { view, points, notes, sortBy } = createApp();
    sortBy(points, "ascending", false);
    sortBy(notes, "ascending", true);

    sortBy(points, "descending", true);

    expect(view().sorts.map((sort) => sort.propertyId)).toEqual([
      points,
      notes,
    ]);
    expect(view().sorts[0]?.direction).toBe("descending");
  });

  it("removes one sort and keeps the others", () => {
    const { view, points, notes, sortBy } = createApp();
    sortBy(points, "ascending", false);
    sortBy(notes, "ascending", true);

    sortBy(points, null, true);

    expect(view().sorts).toEqual([
      { propertyId: notes, direction: "ascending" },
    ]);
  });
});
