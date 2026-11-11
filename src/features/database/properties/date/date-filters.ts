// The filters of a date property: on, before and after a day, compared
// with the first day, and within a period around today.
import { COPY } from "../../../../ui/copy.ts";
import {
  IS_EMPTY,
  IS_NOT_EMPTY,
  type FilterOperator,
} from "../../property-definition.ts";
import {
  isDay,
  overlaps,
  readDateValue,
  shiftDay,
  type DateValue,
} from "./date-value.ts";

function comparison(
  id: string,
  label: string,
  test: (order: number) => boolean,
): FilterOperator {
  return {
    id,
    label,
    needsOperand: true,
    test(value, operand) {
      const date = readDateValue(value);
      const other = operand.trim();
      return date !== undefined && isDay(other)
        ? test(date.start.localeCompare(other))
        : false;
    },
  };
}

const PERIODS = {
  "past-week": [-7, "day"],
  "past-month": [-1, "month"],
  "past-year": [-1, "year"],
  "next-week": [7, "day"],
  "next-month": [1, "month"],
  "next-year": [1, "year"],
} as const;

type Period = keyof typeof PERIODS;

function isPeriod(text: string): text is Period {
  return Object.hasOwn(PERIODS, text);
}

// Whether the value shares a day with the period from today to the day
// the period reaches, both included.
function isWithin(value: DateValue, period: Period, today: string): boolean {
  const [count, unit] = PERIODS[period];
  const other = shiftDay(today, count, unit);
  return count < 0
    ? overlaps(value, other, today)
    : overlaps(value, today, other);
}

const WITHIN: FilterOperator = {
  id: "within",
  label: COPY.database.isWithin,
  needsOperand: true,
  test(value, operand, context) {
    const date = readDateValue(value);
    const today = context?.today ?? "";
    if (date === undefined || !isPeriod(operand) || !isDay(today)) {
      return false;
    }
    return isWithin(date, operand, today);
  },
  choices: () =>
    Object.keys(PERIODS).flatMap((id) =>
      isPeriod(id) ? [{ id, label: COPY.database.periods[id] }] : [],
    ),
};

export const DATE_FILTERS: readonly FilterOperator[] = [
  comparison("is", "Is", (order) => order === 0),
  comparison("before", "Is before", (order) => order < 0),
  comparison("after", "Is after", (order) => order > 0),
  WITHIN,
  IS_EMPTY,
  IS_NOT_EMPTY,
];
