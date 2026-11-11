// When a row was created or last changed. The app keeps these values on
// the row's own record, so they are shown and never edited.
import type {
  FilterOperator,
  PropertyType,
} from "../../property-definition.ts";

const ISO_TIME = /^\d{4}-\d{2}-\d{2}T/;

function readTime(stored: unknown): string | undefined {
  return typeof stored === "string" && ISO_TIME.test(stored)
    ? stored
    : undefined;
}

const formatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatTime(value: unknown): string {
  const time = readTime(value);
  return time === undefined ? "" : formatter.format(new Date(time));
}

// Filters compare the day only: "2026-11-10".
function dayComparison(
  id: string,
  label: string,
  test: (order: number) => boolean,
): FilterOperator {
  return {
    id,
    label,
    needsOperand: true,
    test: (value, operand) => {
      const time = readTime(value);
      const day = operand.trim();
      return (
        time !== undefined &&
        day !== "" &&
        test(time.slice(0, 10).localeCompare(day))
      );
    },
  };
}

export function timestampProperty(
  type: string,
  label: string,
  field: "createdAt" | "updatedAt",
): PropertyType {
  return {
    type,
    label,
    editor: "none",
    input: { type: "date" },
    computedFrom: field,
    read: readTime,
    parse: () => undefined,
    format: formatTime,
    compare: (a, b) => String(a).localeCompare(String(b)),
    filterOperators: [
      dayComparison("is", "Is", (order) => order === 0),
      dayComparison("before", "Is before", (order) => order < 0),
      dayComparison("after", "Is after", (order) => order > 0),
    ],
    renderCell: formatTime,
  };
}

export const createdTimeProperty = timestampProperty(
  "created-time",
  "Created time",
  "createdAt",
);
