// Version 29 lets a view's filter be marked advanced, as Notion's
// advanced filter, and lets a date with an end and a time give the end a
// time of its own (`endTime`). Both are optional: a version 28 file
// holds neither, and reads the same in version 29.
import type { Migration } from "./run-migrations.ts";

export const addAdvancedFilters: Migration = (file) => file;
