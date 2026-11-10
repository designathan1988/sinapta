import { databaseCommands as columnAndRowCommands } from "./database.commands.ts";
import { tableCommands } from "./table.commands.ts";
import { viewCommands } from "./view.commands.ts";

export { createDatabase } from "./database.commands.ts";
export { renderDatabase } from "./database.view.ts";

// Every command of the database feature, registered in one line at startup.
export const databaseCommands = [
  ...columnAndRowCommands,
  ...viewCommands,
  ...tableCommands,
];
