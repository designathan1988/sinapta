// Version 4 adds a page's cover and its full width option. Both are
// optional, so every version 3 page is already a valid version 4 page.
import type { Migration } from "./run-migrations.ts";

export const addPageCover: Migration = (file) => file;
