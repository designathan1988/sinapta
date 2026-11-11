// Version 10 adds an image's width and alignment. Both are optional, so
// every version 9 image is a valid version 10 image: full width and
// centered.
import type { Migration } from "./run-migrations.ts";

export const addDisplayOptions: Migration = (file) => file;
