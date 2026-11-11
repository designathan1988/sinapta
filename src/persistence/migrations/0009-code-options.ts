// Version 9 adds a language, line wrapping and a caption to code blocks.
// All three are optional, so every version 8 code block is a valid
// version 9 code block: plain, unwrapped and without a caption.
import type { Migration } from "./run-migrations.ts";

export const addCodeOptions: Migration = (file) => file;
