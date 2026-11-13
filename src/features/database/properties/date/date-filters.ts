// The filters of a date property, as Notion's: on, before and after a
// day, and relative to today, each testing the start of a range or, when
// the condition says so, its end. "Within" is kept for filters saved
// before Notion's relative condition replaced it.
import { COPY } from "../../../../ui/copy.ts";
import {
  IS_EMPTY,
  IS_NOT_EMPTY,
  type FilterContext,
  type FilterOperator,
} from "../../property-definition.ts";
import {
  DEFAULT_RELATIVE,
  readRelative,
  relativeSpan,
} from "./date-relative.ts";
import {
  formatDateValue,
  isDay,
  overlaps,
  readDateValue,
  shiftDay,
  type DateValue,
} from "./date-value.ts";

// The day a condition tests: the range's end when it says so, else its
// start.
function testedDay(
  value: unknown,
  context: FilterContext | undefined,
): DateValue | undefined {
  const date = readDateValue(value);
  if (date === undefined) return undefined;
  const day =
    context?.filter?.dateEnd === "end" ? (date.end ?? date.start) : date.start;
  return { start: day };
}

function comparison(
  id: string,
  label: string,
  test: (order: number) => boolean,
): FilterOperator {
  return {
    id,
    label,
    needsOperand: true,
    test(value, operand, context) {
      const date = testedDay(value, context);
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
  isRetired: true,
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

// "Is between" two days, both included, written "start..end"; an
// operand without both days lets every row through, as a blank one.
export const BETWEEN_SEPARATOR = "..";

export function readBetween(operand: string): [string, string] | undefined {
  const [from = "", to = ""] = operand.split(BETWEEN_SEPARATOR);
  return isDay(from) && isDay(to) ? [from, to] : undefined;
}

const BETWEEN: FilterOperator = {
  id: "between",
  label: COPY.database.isBetween,
  needsOperand: true,
  operandEditor: "between",
  // "Nov 10, 2026 → Nov 14, 2026", nothing while a day is missing.
  describe: (operand) => {
    const days = readBetween(operand);
    if (days === undefined) return "";
    return formatDateValue({ start: days[0], end: days[1] });
  },
  test(value, operand, context) {
    const days = readBetween(operand);
    if (days === undefined) return true;
    const date = testedDay(value, context);
    const [from, to] = days[0] <= days[1] ? days : [days[1], days[0]];
    return date !== undefined && overlaps(date, from, to);
  },
};

// An operand Notion cannot read lets every row through, as a blank one.
export const RELATIVE: FilterOperator = {
  id: "relative",
  label: COPY.database.relativeToToday,
  needsOperand: true,
  defaultOperand: DEFAULT_RELATIVE,
  operandEditor: "relative",
  describe: (operand) => {
    const relative = readRelative(operand);
    if (relative === undefined) return operand;
    const { relativeDirections, relativeUnits } = COPY.database;
    const unit = relativeUnits[relative.unit];
    return `${relativeDirections[relative.direction]} ${unit}`;
  },
  test(value, operand, context) {
    const relative = readRelative(operand);
    const today = context?.today ?? "";
    if (relative === undefined) return true;
    const date = testedDay(value, context);
    if (date === undefined || !isDay(today)) return false;
    const span = relativeSpan(relative, today, context?.weekStartsOn ?? 0);
    return overlaps(date, span.from, span.to);
  },
};

export const DATE_FILTERS: readonly FilterOperator[] = [
  comparison("is", "Is", (order) => order === 0),
  comparison("before", "Is before", (order) => order < 0),
  comparison("after", "Is after", (order) => order > 0),
  comparison("on-or-before", "Is on or before", (order) => order <= 0),
  comparison("on-or-after", "Is on or after", (order) => order >= 0),
  BETWEEN,
  RELATIVE,
  WITHIN,
  IS_EMPTY,
  IS_NOT_EMPTY,
];
