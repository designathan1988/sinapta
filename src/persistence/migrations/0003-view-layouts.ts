// Version 3 adds board, gallery, list and calendar views, and the optional
// properties they lay rows out by. Every version 2 view is a table view,
// which is still valid, so nothing moves.
import type { Migration } from "./run-migrations.ts";

export const addViewLayouts: Migration = (file) => file;
