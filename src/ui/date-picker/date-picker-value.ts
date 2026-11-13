// What a date picker holds and how its choices change it: a first day,
// an optional last day, an optional time and an optional reminder.

// When a date reminds, as Notion's: on its day, or some days before.
export const REMINDERS = ["day-of", "1-day", "2-days", "1-week"] as const;
export type Reminder = (typeof REMINDERS)[number];
export const REMINDER_DAYS: Readonly<Record<Reminder, number>> = {
  "day-of": 0,
  "1-day": 1,
  "2-days": 2,
  "1-week": 7,
};

export interface DateRangeValue {
  readonly start: string;
  readonly end?: string;
  readonly time?: string;
  readonly remind?: Reminder;
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
  // False leaves out the fields of the chosen days, as in the search's
  // date filter, which shows only the month.
  readonly hasFields?: boolean;
  // True for a month that is only shown, as Notion's relative date
  // filter (n70-next-week): no Today, the range's end dimmed and the
  // days after it grey.
  readonly isShownOnly?: boolean;
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

// The value after a day is typed into the first or last day's field; a
// range stays in order when the typed day passes its other end.
export function withDay(
  value: DateRangeValue,
  day: string,
  isEnd: boolean,
): DateRangeValue {
  if (value.end === undefined) return { ...value, start: day };
  const other = isEnd ? value.start : value.end;
  const [start = day, end = day] = [day, other].sort();
  return { ...value, start, end };
}

// The first time a date takes when it starts to include one.
export const DEFAULT_TIME = "09:00";
