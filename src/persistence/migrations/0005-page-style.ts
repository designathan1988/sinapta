// Version 5 adds how a page looks: the cover's vertical position, and
// (with task 12.2) its font and small text. Every key is optional, so every
// version 4 page is already a valid version 5 page.
import type { Migration } from "./run-migrations.ts";

export const addPageStyle: Migration = (file) => file;
