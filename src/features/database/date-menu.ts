// A date property's calendar, in the menu its value opens on a row's page
// or in the table, as Notion's: the picker above, "End date", "Include
// time" and "Clear" under it. The month shown is the open overlay's
// panel, so the arrows move it through the store.
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
import { readDateValue, type DateValue } from "./properties/date/index.ts";

const MONTH_PANEL = "month:";

export interface DateMenuInput {
  readonly stored: unknown;
  readonly label: string;
  readonly overlay: OpenOverlay | null;
  readonly dispatch: Dispatch;
  // Undefined clears the date.
  readonly onChange: (next: DateValue | undefined) => void;
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
  return { lead: renderDatePicker(props), items: datePickerItems(props) };
}
