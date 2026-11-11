import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION } from "../../model/index.ts";
import {
  isMigrationListComplete,
  runMigrations,
  type Migration,
} from "./run-migrations.ts";

const addLabel: Migration = (file) => ({ ...file, label: "added in 2" });
const renameLabel: Migration = ({ label, ...rest }) => ({
  ...rest,
  name: label,
});
const MIGRATIONS = [addLabel, renameLabel];

describe("runMigrations", () => {
  it("returns a file at the current version unchanged", () => {
    const file = { schemaVersion: 3, name: "kept" };

    expect(runMigrations(file, MIGRATIONS)).toEqual({ ok: true, file });
  });

  it("applies every migration in order from an older version", () => {
    const result = runMigrations({ schemaVersion: 1 }, MIGRATIONS);

    expect(result).toEqual({
      ok: true,
      file: { schemaVersion: 3, name: "added in 2" },
    });
  });

  it("applies only the migrations after the file's version", () => {
    const result = runMigrations(
      { schemaVersion: 2, label: "mine" },
      MIGRATIONS,
    );

    expect(result).toEqual({
      ok: true,
      file: { schemaVersion: 3, name: "mine" },
    });
  });

  it("rejects a file newer than the app", () => {
    expect(runMigrations({ schemaVersion: 4 }, MIGRATIONS)).toEqual({
      ok: false,
      error: { kind: "newer-version", schemaVersion: 4 },
    });
  });

  it("rejects a file with no version", () => {
    expect(runMigrations({ rootIds: [] }, MIGRATIONS)).toEqual({
      ok: false,
      error: { kind: "missing-version" },
    });
  });

  it("rejects a value that is not an object", () => {
    expect(runMigrations("text", MIGRATIONS)).toMatchObject({ ok: false });
  });
});

describe("the migration list", () => {
  it("reaches the app's schema version", () => {
    expect(isMigrationListComplete()).toBe(true);
  });

  it("reads a version 1 file as the current version without changing its data", () => {
    const file = { schemaVersion: 1, rootIds: ["a"], views: {} };

    expect(runMigrations(file)).toEqual({
      ok: true,
      file: { schemaVersion: SCHEMA_VERSION, rootIds: ["a"], views: {} },
    });
  });

  it("reads a version 12 database's properties unchanged, with no config", () => {
    const properties = [{ id: "p", name: "Stage", type: "select" }];
    const blocks = { db: { type: "database", props: { properties } } };

    expect(runMigrations({ schemaVersion: 12, blocks })).toEqual({
      ok: true,
      file: { schemaVersion: SCHEMA_VERSION, blocks },
    });
  });

  it("turns a version 13 date into a date range that starts that day", () => {
    const properties = [
      { id: "due", name: "Due", type: "date" },
      { id: "code", name: "Code", type: "text" },
    ];
    const row = (values: Record<string, unknown>) => ({
      type: "page",
      parentId: "db",
      props: { values },
    });
    const blocks = {
      db: { type: "database", props: { properties } },
      r1: row({ due: "2026-11-10", code: "2026-01-01" }),
      r2: row({ due: { start: "2026-11-12" } }),
      r3: row({ due: "not a date" }),
      loose: {
        type: "page",
        parentId: null,
        props: { values: { due: "2026-11-10" } },
      },
    };

    const result = runMigrations({ schemaVersion: 13, blocks });

    expect(result).toEqual({
      ok: true,
      file: {
        schemaVersion: SCHEMA_VERSION,
        blocks: {
          ...blocks,
          r1: row({ due: { start: "2026-11-10" }, code: "2026-01-01" }),
        },
      },
    });
  });
});

describe("version 15", () => {
  it("reads a version 14 file unchanged: linked views and inline databases are new", () => {
    const blocks = { db: { type: "database", props: { viewIds: ["v"] } } };

    expect(runMigrations({ schemaVersion: 14, blocks })).toEqual({
      ok: true,
      file: { schemaVersion: SCHEMA_VERSION, blocks },
    });
  });
});

describe("version 16", () => {
  it("reads a version 15 view's filters as an and group of them", () => {
    const filters = [
      { propertyId: "a", operator: "is", value: "x" },
      { propertyId: "b", operator: "is-empty", value: "" },
    ];
    const views = { v: { id: "v", filters, sorts: [] } };

    expect(runMigrations({ schemaVersion: 15, views })).toEqual({
      ok: true,
      file: {
        schemaVersion: SCHEMA_VERSION,
        views: {
          v: {
            id: "v",
            sorts: [],
            filter: { conjunction: "and", items: filters },
          },
        },
      },
    });
  });
});

describe("version 17", () => {
  it("turns a board's group property into its grouping, and drops it from other layouts", () => {
    const views = {
      b: { id: "b", type: "board", groupPropertyId: "p" },
      t: { id: "t", type: "table", groupPropertyId: "p" },
    };

    expect(runMigrations({ schemaVersion: 16, views })).toEqual({
      ok: true,
      file: {
        schemaVersion: SCHEMA_VERSION,
        views: {
          b: {
            id: "b",
            type: "board",
            groupBy: {
              propertyId: "p",
              sort: "manual",
              hideEmpty: false,
              collapsed: [],
              dateBy: "month",
            },
          },
          t: { id: "t", type: "table" },
        },
      },
    });
  });
});
