// Version 6 adds an optional color to every block that holds text. Every
// version 5 block is already a valid version 6 block.
import type { Migration } from "./run-migrations.ts";

export const addBlockColor: Migration = (file) => file;
