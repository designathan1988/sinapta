// Version 33 lets a database automation send a Slack notification, as
// Notion's. The switch is optional: a version 32 file holds none, and
// reads the same in version 33.
import type { Migration } from "./run-migrations.ts";

export const addAutomationSlack: Migration = (file) => file;
