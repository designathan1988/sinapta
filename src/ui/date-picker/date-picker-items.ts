// The rows under a date picker, as Notion's: "End date" and "Include
// time" switches, then "Clear".
import { COPY } from "../copy.ts";
import type { MenuEntry, MenuItem } from "../menu/index.ts";
import {
  DEFAULT_TIME,
  REMINDERS,
  type DatePickerProps,
  type Reminder,
} from "./date-picker-value.ts";

const TEXT = COPY.datePicker;

// "Remind", with its choices beside it: none, or a day before the date.
function remindItem(props: DatePickerProps): MenuItem {
  const { value, onChange } = props;
  const start = value?.start ?? props.today;
  const choose = (remind: Reminder | undefined) => () => {
    const { remind: _remind, ...rest } = value ?? { start };
    onChange(remind === undefined ? rest : { ...rest, remind });
  };
  const choices: MenuEntry[] = [undefined, ...REMINDERS].map((remind) => ({
    label: TEXT.reminders[remind ?? "none"],
    check: "radio",
    isChecked: value?.remind === remind,
    onSelect: choose(remind),
  }));
  return {
    label: TEXT.remind,
    value: TEXT.reminders[value?.remind ?? "none"],
    submenu: {
      id: "date-remind",
      menu: () => ({ label: TEXT.remind, items: choices }),
    },
  };
}

export function datePickerItems(props: DatePickerProps): MenuEntry[] {
  const { value, onChange } = props;
  const hasEnd = value?.end !== undefined;
  const hasTime = value?.time !== undefined;
  const start = value?.start ?? props.today;
  return [
    {
      label: TEXT.endDate,
      check: "switch",
      isChecked: hasEnd,
      onSelect: () => {
        const { end: _end, endTime: _endTime, ...rest } = value ?? { start };
        const endTime = rest.time === undefined ? {} : { endTime: rest.time };
        onChange(hasEnd ? rest : { ...rest, end: start, ...endTime });
      },
    },
    {
      label: TEXT.includeTime,
      check: "switch",
      isChecked: hasTime,
      onSelect: () => {
        const { time: _time, endTime: _endTime, ...rest } = value ?? { start };
        const endTime = hasEnd ? { endTime: DEFAULT_TIME } : {};
        onChange(hasTime ? rest : { ...rest, time: DEFAULT_TIME, ...endTime });
      },
    },
    remindItem(props),
    { kind: "divider" },
    {
      label: TEXT.clear,
      onSelect: () => {
        onChange(undefined);
      },
    },
  ];
}
