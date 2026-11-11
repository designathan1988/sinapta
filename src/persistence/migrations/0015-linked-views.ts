// Version 15 adds linked views, a new block type, and inline databases,
// an optional prop of a database. Every version 14 file is a valid
// version 15 file; an older app refuses a version 15 one rather than
// dropping what it cannot read.
import type { Migration } from "./run-migrations.ts";

export const addLinkedViews: Migration = (file) => file;
