// Version 11 adds equations: an equation block, a new type, and inline
// equations, an optional key of a text span. Every version 10 file is a
// valid version 11 file.
import type { Migration } from "./run-migrations.ts";

export const addEquations: Migration = (file) => file;
