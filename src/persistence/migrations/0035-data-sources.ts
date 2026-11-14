// Version 35 lets a database hold other databases as data sources, and a
// view show one of them, as Notion's Manage data sources. Both fields are
// optional: a version 34 file holds neither, and reads the same in 35.
import type { Migration } from "./run-migrations.ts";

export const addDataSources: Migration = (file) => file;
