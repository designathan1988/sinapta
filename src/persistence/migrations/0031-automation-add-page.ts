// Version 31 lets a database automation add a page to a database, as
// Notion's "Add page to". The field is optional: a version 30 file holds
// none, and reads the same in version 31.
import type { Migration } from "./run-migrations.ts";

export const addAutomationPages: Migration = (file) => file;
