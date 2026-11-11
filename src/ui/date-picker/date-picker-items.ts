// The rows under a date picker, as Notion's: "End date" and "Include
// time" switches, then "Clear".
import { COPY } from "../copy.ts";
import type { MenuEntry } from "../menu/index.ts";
import { DEFAULT_TIME, type DatePickerProps } from "./date-picker-value.ts";

const TEXT = COPY.datePicker;

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
        const { end: _end, ...rest } = value ?? { start };
        onChange(hasEnd ? rest : { ...rest, end: start });
      },
    },
    {
      label: TEXT.includeTime,
      check: "switch",
      isChecked: hasTime,
      onSelect: () => {
        const { time: _time, ...rest } = value ?? { start };
        onChange(hasTime ? rest : { ...rest, time: DEFAULT_TIME });
      },
    },
    { kind: "divider" },
    {
      label: TEXT.clear,
      onSelect: () => {
        onChange(undefined);
      },
    },
  ];
}
