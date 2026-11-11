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
import { cardCommands } from "./card.commands.ts";
import { calendarOptionCommands } from "./calendar-options.commands.ts";
import { timelineOptionCommands } from "./timeline-options.commands.ts";
import { chartOptionCommands } from "./chart-options.commands.ts";
import { formOptionCommands } from "./form-options.commands.ts";
import { rowOpenCommands } from "./row-open.commands.ts";
import { templateCommands } from "./template.commands.ts";
import { csvImportCommands } from "./csv-import.commands.ts";
import { formCommands } from "./layouts/form/form.commands.ts";
import { boardCardCommands } from "./layouts/board/board-card.commands.ts";

export { createDatabase } from "./database.commands.ts";
export { openRow } from "./row-open.commands.ts";
export { addRow } from "./row.commands.ts";
export { selectTableModel } from "./table-model.selectors.ts";
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
export { renderTemplateBanner } from "./template-banner.view.ts";
export { importCsvFile } from "./csv-file.view.ts";

import { optionCommands } from "./option.commands.ts";
import { propertyCopyCommands } from "./property-copy.commands.ts";
import { propertyTypeCommands } from "./property-type.commands.ts";
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
  ...cardCommands,
  ...calendarOptionCommands,
  ...timelineOptionCommands,
  ...chartOptionCommands,
  ...formOptionCommands,
  ...rowOpenCommands,
  ...templateCommands,
  ...csvImportCommands,
  ...formCommands,
  ...boardCardCommands,
  ...viewLayoutCommands,
  ...viewSearchCommands,
  ...calendarCommands,
  ...tableCommands,
  ...optionCommands,
  ...propertyTypeCommands,
  ...propertyCopyCommands,
  createInlineDatabase,
  ...linkedViewCommands,
  ...relationCommands,
  ...buttonPropertyCommands,
];

// The rules that keep database data whole after any command.
export const DATABASE_TIDIERS = [relationTidier];
