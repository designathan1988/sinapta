// Groups of dates: the day, week, month or year a date's first day falls
// in, put in order by that span's first day.
import { COPY } from "../../../../ui/copy.ts";
import type {
  DateStep,
  GroupKey,
  Grouping,
} from "../../grouping-definition.ts";
import { readDateValue } from "./date-value.ts";

const DAY = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const MONTH = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function utc(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

// The Monday of the day's week, as ISO weeks start on Monday.
function weekStart(day: string): string {
  const date = utc(day);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

const GROUP_OF: Readonly<Record<DateStep, (day: string) => GroupKey>> = {
  day: (day) => ({ key: day, label: DAY.format(utc(day)), sortValue: day }),
  week: (day) => {
    const start = weekStart(day);
    const label = `${COPY.database.weekOf} ${DAY.format(utc(start))}`;
    return { key: start, label, sortValue: start };
  },
  month: (day) => {
    const key = day.slice(0, 7);
    return { key, label: MONTH.format(utc(day)), sortValue: key };
  },
  year: (day) => {
    const key = day.slice(0, 4);
    return { key, label: key, sortValue: key };
  },
};

export const DATE_GROUPING: Grouping = {
  keysOf: (value, _property, groupBy) => {
    const date = readDateValue(value);
    const step: DateStep = groupBy?.dateBy ?? "month";
    return date === undefined ? [] : [GROUP_OF[step](date.start)];
  },
};
