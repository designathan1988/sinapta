// Version 13 gives each property an optional config in the shape its type
// declares, such as a number's format. A version 12 property has none and
// uses its type's defaults, so every version 12 file is a valid version 13
// file.
import type { Migration } from "./run-migrations.ts";

export const addPropertyConfig: Migration = (file) => file;
