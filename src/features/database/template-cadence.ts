// The cadence being edited in "Edit cadence", before Save: kept in the
// open overlay's values as "key=value" lines, read back as a draft, and
// saved as a template's repeat. Notion's eight choices start a draft.
import type { Repeat, RepeatPeriod } from "../../blocks/page/index.ts";
import { REPEAT_PERIODS } from "../../blocks/page/index.ts";
import { weekdayOf } from "./repeat-rule.ts";
import type { Cadence } from "./template-repeat.commands.ts";

export const CADENCE_VALUES = "cadence";

export type Ending = "never" | "count" | "date";

export interface CadenceDraft {
  readonly every: RepeatPeriod;
  readonly interval: number;
  readonly weekdays: readonly number[];
  // "" is around midnight.
  readonly time: string;
  readonly start: string;
  readonly ending: Ending;
  readonly count: number;
  readonly endsOn: string;
  // The month the start's or the last day's calendar shows, "YYYY-MM".
  readonly month: string;
}

export const CADENCE_PRESETS = [
  "day",
  "weekday",
  "week",
  "twoWeeks",
  "month",
  "threeMonths",
  "sixMonths",
  "year",
] as const;

export type CadencePreset = (typeof CADENCE_PRESETS)[number];

const PRESETS: Readonly<
  Record<CadencePreset, Pick<CadenceDraft, "every" | "interval">>
> = {
  day: { every: "day", interval: 1 },
  weekday: { every: "week", interval: 1 },
  week: { every: "week", interval: 1 },
  twoWeeks: { every: "week", interval: 2 },
  month: { every: "month", interval: 1 },
  threeMonths: { every: "month", interval: 3 },
  sixMonths: { every: "month", interval: 6 },
  year: { every: "year", interval: 1 },
};

function tomorrowOf(today: string): string {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

// A new draft from one of the eight choices, starting tomorrow; weeks
// start on Monday, as Notion's, and weekdays on Monday to Friday.
export function presetDraft(
  preset: CadencePreset,
  today: string,
): CadenceDraft {
  const start = tomorrowOf(today);
  const weekdays = preset === "weekday" ? [0, 1, 2, 3, 4] : [0];
  return {
    ...PRESETS[preset],
    weekdays,
    time: "",
    start,
    ending: "never",
    count: 1,
    endsOn: start,
    month: start.slice(0, 7),
  };
}

// The draft of a saved repeat, to change it.
export function repeatDraft(repeat: Repeat, today: string): CadenceDraft {
  const start = repeat.start ?? repeat.next;
  const ending: Ending =
    repeat.endsAfter !== undefined
      ? "count"
      : repeat.endsOn !== undefined
        ? "date"
        : "never";
  return {
    every: repeat.every,
    interval: repeat.interval ?? 1,
    weekdays: repeat.weekdays ?? [weekdayOf(start)],
    time: repeat.time ?? "",
    start,
    ending,
    count: repeat.endsAfter ?? 1,
    endsOn: repeat.endsOn ?? tomorrowOf(today),
    month: start.slice(0, 7),
  };
}

export function writeDraft(draft: CadenceDraft): string[] {
  return Object.entries(draft).map(
    ([key, value]) =>
      `${key}=${Array.isArray(value) ? value.join(",") : String(value)}`,
  );
}

function periodOf(text: string | undefined): RepeatPeriod {
  return REPEAT_PERIODS.find((period) => period === text) ?? "week";
}

function endingOf(text: string | undefined): Ending {
  return text === "count" || text === "date" ? text : "never";
}

function countOf(text: string | undefined): number {
  const count = Number(text);
  return Number.isInteger(count) && count >= 1 ? Math.min(count, 99) : 1;
}

// The draft the lines hold, or none when no draft is open.
export function readDraft(
  lines: readonly string[] | undefined,
): CadenceDraft | undefined {
  if (lines === undefined || lines.length === 0) return undefined;
  const entries = new Map(
    lines.map((line) => [
      line.slice(0, line.indexOf("=")),
      line.slice(line.indexOf("=") + 1),
    ]),
  );
  const start = entries.get("start") ?? "";
  return {
    every: periodOf(entries.get("every")),
    interval: countOf(entries.get("interval")),
    weekdays: (entries.get("weekdays") ?? "")
      .split(",")
      .filter((text) => text !== "")
      .map(Number),
    time: entries.get("time") ?? "",
    start,
    ending: endingOf(entries.get("ending")),
    count: countOf(entries.get("count")),
    endsOn: entries.get("endsOn") ?? start,
    month: entries.get("month") ?? start.slice(0, 7),
  };
}

// What Save stores.
export function draftCadence(draft: CadenceDraft): Cadence {
  return {
    every: draft.every,
    ...(draft.interval > 1 && { interval: draft.interval }),
    ...(draft.every === "week" &&
      draft.weekdays.length > 0 && { weekdays: [...draft.weekdays] }),
    ...(draft.time !== "" && { time: draft.time }),
    start: draft.start,
    ...(draft.ending === "count" && { endsAfter: draft.count }),
    ...(draft.ending === "date" && { endsOn: draft.endsOn }),
  };
}
