// Version 30 lets a database hold automations, as Notion's database
// automations. The list is optional: a version 29 file holds none, and
// reads the same in version 30.
import type { Migration } from "./run-migrations.ts";

export const addAutomations: Migration = (file) => file;
