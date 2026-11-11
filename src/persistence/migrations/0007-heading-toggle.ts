// Version 7 adds heading level 4 and toggle headings. Both only widen
// what a heading may be, so every version 6 heading is a valid version 7
// heading.
import type { Migration } from "./run-migrations.ts";

export const addHeadingToggle: Migration = (file) => file;
