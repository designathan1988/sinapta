import { databaseCommands as columnCommands } from "./database.commands.ts";
import { databaseStartCommands } from "./database-start.commands.ts";
import { rowCommands } from "./row.commands.ts";
import { tableCommands } from "./table.commands.ts";
import { calendarCommands } from "./layouts/calendar/calendar.commands.ts";
import { viewLayoutCommands } from "./view-layout.commands.ts";
import { viewSearchCommands } from "./view-search.commands.ts";
import { viewCommands } from "./view.commands.ts";
import { groupCommands } from "./group.commands.ts";
import { calculationCommands } from "./calculation.commands.ts";
import { rowBulkCommands } from "./row-bulk.commands.ts";
import { tableLayoutCommands } from "./table-layout.commands.ts";

export { createDatabase } from "./database.commands.ts";
export { groupByProperty } from "./group.commands.ts";
export { startDatabase } from "./database-start.commands.ts";
export { renderDatabase } from "./database.view.ts";
export { renderInlineDatabase } from "./database-inline.view.ts";
export { renderLinkedView } from "./linked-view.view.ts";
export { createLinkedView } from "./linked-view.commands.ts";
export { createInlineDatabase } from "./inline-database.commands.ts";
export { readDateValue, type DateValue } from "./properties/date/index.ts";
export { withPropertyConfigs } from "./property-registry.ts";
export { renderRowProperties } from "./row-properties.view.ts";

import { optionCommands } from "./option.commands.ts";
import { createInlineDatabase } from "./inline-database.commands.ts";
import { linkedViewCommands } from "./linked-view.commands.ts";
import { buttonPropertyCommands } from "./properties/button/index.ts";
import {
  relationCommands,
  relationTidier,
} from "./properties/relation/index.ts";

// Every command of the database feature, registered in one line at startup.
export const databaseCommands = [
  ...columnCommands,
  ...databaseStartCommands,
  ...rowCommands,
  ...viewCommands,
  ...groupCommands,
  ...calculationCommands,
  ...rowBulkCommands,
  ...tableLayoutCommands,
  ...viewLayoutCommands,
  ...viewSearchCommands,
  ...calendarCommands,
  ...tableCommands,
  ...optionCommands,
  createInlineDatabase,
  ...linkedViewCommands,
  ...relationCommands,
  ...buttonPropertyCommands,
];

// The rules that keep database data whole after any command.
export const DATABASE_TIDIERS = [relationTidier];
