import {
  IS_EMPTY,
  IS_NOT_EMPTY,
  type FilterOperator,
  type PropertyType,
} from "../../property-definition.ts";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Dates are stored as calendar days, "2026-11-10", with no time or zone.
function readDate(stored: unknown): string | undefined {
  if (typeof stored !== "string" || !ISO_DATE.test(stored)) return undefined;
  return Number.isNaN(Date.parse(stored)) ? undefined : stored;
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
    test(value, operand) {
      const date = readDate(value);
      const other = readDate(operand.trim());
      return (
        date !== undefined &&
        other !== undefined &&
        test(date.localeCompare(other))
      );
    },
  };
}

const formatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export const dateProperty: PropertyType = {
  type: "date",
  label: "Date",
  editor: "date",
  input: { type: "date" },
  read: readDate,
  parse: (text) => readDate(text.trim()),
  format: (value) => readDate(value) ?? "",
  // ISO dates sort correctly as text.
  compare: (a, b) => String(a).localeCompare(String(b)),
  filterOperators: [
    comparison("is", "Is", (order) => order === 0),
    comparison("before", "Is before", (order) => order < 0),
    comparison("after", "Is after", (order) => order > 0),
    IS_EMPTY,
    IS_NOT_EMPTY,
  ],
  renderCell(value) {
    const date = readDate(value);
    return date === undefined
      ? ""
      : formatter.format(new Date(`${date}T00:00:00Z`));
  },
};
