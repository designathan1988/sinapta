// Version 2 adds underline and strikethrough marks and the color and
// highlight of a text span. Every version 1 file is already a valid
// version 2 file: nothing was renamed or removed, so nothing moves.
import type { Migration } from "./run-migrations.ts";

export const addTextStyles: Migration = (file) => file;
