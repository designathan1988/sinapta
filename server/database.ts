import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { MIGRATIONS } from "./migrations.ts";
import { migrationRowSchema, readRow } from "./rows.schema.ts";

export type Database = DatabaseSync;

// Opens the database file (":memory:" in tests), with write-ahead logging
// and foreign keys on, and brings its schema up to date.
export function openDatabase(path: string): Database {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  migrate(db);
  return db;
}

function appliedSteps(db: Database): number {
  db.exec("CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY)");
  const row = db
    .prepare("SELECT COALESCE(MAX(id), 0) AS id FROM migrations")
    .get();
  return readRow(migrationRowSchema, row)?.id ?? 0;
}

function migrate(db: Database): void {
  const done = appliedSteps(db);
  MIGRATIONS.slice(done).forEach((sql, index) => {
    inTransaction(db, () => {
      db.exec(sql);
      db.prepare("INSERT INTO migrations (id) VALUES (?)").run(
        done + index + 1,
      );
    });
  });
}

// Runs a change whole or not at all.
export function inTransaction<T>(db: Database, change: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = change();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
