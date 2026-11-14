// Version 36 marks a database added to another as a data source, which
// keeps it out of the sidebar, as Notion's. The mark is optional: a
// version 35 file holds none, and reads the same in version 36.
import type { Migration } from "./run-migrations.ts";

export const addSourceOwners: Migration = (file) => file;
