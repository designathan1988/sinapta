// What a date picker holds and how its choices change it: a first day,
// an optional last day and an optional time.

export interface DateRangeValue {
  readonly start: string;
  readonly end?: string;
  readonly time?: string;
}

export interface DatePickerProps {
  // Names the picker for assistive tools.
  readonly label: string;
  readonly value: DateRangeValue | undefined;
  // The month shown, "YYYY-MM".
  readonly month: string;
  // Today, "YYYY-MM-DD", marked in the calendar.
  readonly today: string;
  // Undefined clears the date.
  readonly onChange: (next: DateRangeValue | undefined) => void;
  readonly onMonth: (month: string) => void;
}

// The value after a day is pressed: with an end, a later day ends the
// range and an earlier one starts it; without, the day is the date.
export function chooseDay(
  value: DateRangeValue | undefined,
  day: string,
): DateRangeValue {
  if (value?.end === undefined) return { ...value, start: day };
  return day > value.start ? { ...value, end: day } : { ...value, start: day };
}

// The first time a date takes when it starts to include one.
export const DEFAULT_TIME = "09:00";
