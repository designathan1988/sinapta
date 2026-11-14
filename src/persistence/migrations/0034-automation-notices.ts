// Version 34 lets a database automation send a notification to people, as
// Notion's "Send notification to", kept on the page it is about. Both
// fields are optional: a version 33 file holds neither, and reads the
// same in version 34.
import type { Migration } from "./run-migrations.ts";

export const addAutomationNotices: Migration = (file) => file;
