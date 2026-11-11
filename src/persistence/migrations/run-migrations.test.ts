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
});
