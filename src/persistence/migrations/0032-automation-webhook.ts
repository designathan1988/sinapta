// Version 32 lets a database automation send a webhook, as Notion's "Send
// webhook". The address is optional: a version 31 file holds none, and
// reads the same in version 32.
import type { Migration } from "./run-migrations.ts";

export const addAutomationWebhooks: Migration = (file) => file;
