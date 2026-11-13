// Groups of numbers, as Notion's "Number by": each value its own group
// (Unique), or intervals of one size within a range (Interval): with the
// range 0 to 1000 and the size 10, 12 falls in "10 to 20" and -5 out of
// the range, a group after the others; groups go from the least up.
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import type { GroupKey, Grouping } from "../../grouping-definition.ts";

// Notion's range until one is set.
export const DEFAULT_RANGE = { from: 0, to: 1000 } as const;

const PLAIN = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  useGrouping: false,
});

// Sorts as text in the order of the numbers: an offset keeps it positive
// and padding keeps every key the same length.
function sortable(index: number): string {
  return String(index + 1e12).padStart(16, "0");
}

interface Interval {
  readonly size: number;
  readonly from?: number | undefined;
  readonly to?: number | undefined;
}

function intervalGroup(value: number, interval: Interval): GroupKey {
  const start = interval.from ?? DEFAULT_RANGE.from;
  const end = interval.to ?? DEFAULT_RANGE.to;
  if (value < start || value >= end) {
    const label = COPY.database.outOfRange;
    return { key: "out-of-range", label, sortValue: "b" };
  }
  const index = Math.floor((value - start) / interval.size);
  const from = PLAIN.format(start + index * interval.size);
  const to = PLAIN.format(Math.min(end, start + (index + 1) * interval.size));
  return {
    key: `${from}..${to}`,
    label: COPY.database.intervalLabel(from, to),
    sortValue: `a${sortable(index)}`,
  };
}

// Unique values are named as the property writes them.
export function numberGrouping(
  format: (value: number, property: PropertyDefinition) => string,
): Grouping {
  return {
    keysOf(value, property, groupBy) {
      if (typeof value !== "number" || !Number.isFinite(value)) return [];
      const by = groupBy?.numberBy;
      if (by?.kind === "interval") return [intervalGroup(value, by)];
      const text = format(value, property);
      return [{ key: text, label: text, sortValue: sortable(value) }];
    },
  };
}
