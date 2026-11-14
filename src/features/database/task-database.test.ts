import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "./database-builder.ts";
import {
  missingProperties,
  missingTaskProperties,
  turnIntoTasks,
} from "./task-database.commands.ts";

describe("Turn into Tasks database, as Notion's", () => {
  it("adds Assignee, Status and Due date where the database lacks them", () => {
    const app = createDatabaseApp([{ name: "When", type: "date" }], []);
    const add = missingTaskProperties(app.database());

    app.dispatch(turnIntoTasks.create({ databaseId: app.databaseId, add }));

    const properties = app.database().props.properties;
    expect(add.map((item) => item.type)).toEqual(["person", "status"]);
    expect(properties.map((item) => [item.name, item.type])).toEqual(
      expect.arrayContaining([
        ["When", "date"],
        ["Assignee", "person"],
        ["Status", "status"],
      ]),
    );
    expect(
      properties.find((item) => item.type === "status")?.options?.length,
    ).toBeGreaterThan(0);
    expect(missingTaskProperties(app.database())).toEqual([]);
  });

  it("is one step, which one undo takes back", () => {
    const app = createDatabaseApp([], []);
    const before = app.database().props.properties.length;
    const add = missingTaskProperties(app.database());
    app.dispatch(turnIntoTasks.create({ databaseId: app.databaseId, add }));

    app.dispatch({ type: "history.undo" });

    expect(app.database().props.properties).toHaveLength(before);
  });

  it("adds Attendees, Date and Type for a Meetings database", () => {
    const app = createDatabaseApp([{ name: "When", type: "date" }], []);
    const add = missingProperties(app.database(), "meetings");

    app.dispatch(turnIntoTasks.create({ databaseId: app.databaseId, add }));

    expect(add.map((item) => [item.name, item.type])).toEqual([
      ["Attendees", "person"],
      ["Type", "select"],
    ]);
    expect(missingProperties(app.database(), "meetings")).toEqual([]);
  });

  it("adds Description and Files for a Skills database, as Notion's help says", () => {
    const app = createDatabaseApp([], []);
    const add = missingProperties(app.database(), "skills");

    app.dispatch(turnIntoTasks.create({ databaseId: app.databaseId, add }));

    expect(add.map((item) => [item.name, item.type])).toEqual([
      ["Description", "text"],
      ["Files", "files"],
    ]);
    expect(missingProperties(app.database(), "skills")).toEqual([]);
  });
});
