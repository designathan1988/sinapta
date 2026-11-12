// A date property's calendar, in the menu its value opens on a row's page
// or in the table, as Notion's: the picker above, then "End date", "Date
// format", "Include time", "Remind" and "Clear". The month shown is the
// open overlay's panel, so the arrows move it through the store.
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { BlockId } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuEntry, MenuItem } from "../../ui/menu/index.ts";
import {
  openOverlayPanel,
  type Dispatch,
  type OpenOverlay,
} from "../../state/index.ts";
import {
  datePickerItems,
  monthOf,
  renderDatePicker,
  type DatePickerProps,
} from "../../ui/date-picker/index.ts";
import type { SelectMenu } from "../../ui/select/index.ts";
import { setPropertyConfig } from "./database.commands.ts";
import { readDateValue, type DateValue } from "./properties/date/index.ts";
import {
  DATE_FORMATS,
  readDateConfig,
  TIME_FORMATS,
  type DateConfig,
} from "./properties/date/date.schema.ts";

const MONTH_PANEL = "month:";
const TEXT = COPY.database;

export interface DateMenuInput {
  readonly stored: unknown;
  readonly label: string;
  // The date property and its database, whose formats the menu sets.
  readonly property: PropertyDefinition;
  readonly databaseId: BlockId | null;
  readonly overlay: OpenOverlay | null;
  readonly dispatch: Dispatch;
  // Undefined clears the date.
  readonly onChange: (next: DateValue | undefined) => void;
}

// "Date format", with the property's date and time formats beside it.
function formatItem(input: DateMenuInput, databaseId: BlockId): MenuItem {
  const { property, dispatch } = input;
  const config = readDateConfig(property.config);
  const choose = (next: DateConfig) => () =>
    dispatch(
      setPropertyConfig.create({
        databaseId,
        propertyId: property.id,
        config: next,
      }),
    );
  const items: MenuEntry[] = [
    { kind: "section", label: TEXT.dateFormat },
    ...DATE_FORMATS.map((dateFormat) => ({
      label: TEXT.dateFormats[dateFormat],
      check: "radio" as const,
      keepsOpen: true,
      isChecked: config.dateFormat === dateFormat,
      onSelect: choose({ ...config, dateFormat }),
    })),
    { kind: "section", label: TEXT.timeFormat },
    ...TIME_FORMATS.map((timeFormat) => ({
      label: TEXT.timeFormats[timeFormat],
      check: "radio" as const,
      keepsOpen: true,
      isChecked: config.timeFormat === timeFormat,
      onSelect: choose({ ...config, timeFormat }),
    })),
  ];
  return {
    label: TEXT.dateFormat,
    submenu: {
      id: "date-format",
      menu: () => ({ label: TEXT.dateFormat, items }),
    },
  };
}

export function dateMenu(input: DateMenuInput): SelectMenu {
  const value = readDateValue(input.stored);
  // Today in the reader's own time zone.
  const today = new Date().toLocaleDateString("en-CA");
  const panel = input.overlay?.panel;
  const month =
    panel?.startsWith(MONTH_PANEL) === true
      ? panel.slice(MONTH_PANEL.length)
      : monthOf(value?.start ?? today);
  const props: DatePickerProps = {
    label: input.label,
    value,
    month,
    today,
    onChange: input.onChange,
    onMonth: (next) =>
      input.dispatch(
        openOverlayPanel.create({ panel: `${MONTH_PANEL}${next}` }),
      ),
  };
  // The format row follows "End date", as in Notion.
  const [endDate, ...rest] = datePickerItems(props);
  const format =
    input.databaseId === null ? [] : [formatItem(input, input.databaseId)];
  const items = endDate === undefined ? rest : [endDate, ...format, ...rest];
  return { lead: renderDatePicker(props), items };
}
