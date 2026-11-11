// Version 8 adds mentions of pages and dates to rich text. A mention is
// an optional key of a span, so every version 7 text is a valid version 8
// text.
import type { Migration } from "./run-migrations.ts";

export const addMentions: Migration = (file) => file;
