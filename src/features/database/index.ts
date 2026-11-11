import { databaseCommands as columnCommands } from "./database.commands.ts";
import { rowCommands } from "./row.commands.ts";
import { tableCommands } from "./table.commands.ts";
import { calendarCommands } from "./layouts/calendar/calendar.commands.ts";
import { viewLayoutCommands } from "./view-layout.commands.ts";
import { viewSearchCommands } from "./view-search.commands.ts";
import { viewCommands } from "./view.commands.ts";

export { createDatabase } from "./database.commands.ts";
export { renderDatabase } from "./database.view.ts";
export { renderRowProperties } from "./row-properties.view.ts";

// Every command of the database feature, registered in one line at startup.
export const databaseCommands = [
  ...columnCommands,
  ...rowCommands,
  ...viewCommands,
  ...viewLayoutCommands,
  ...viewSearchCommands,
  ...calendarCommands,
  ...tableCommands,
];
