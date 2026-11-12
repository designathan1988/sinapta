// A timeline of a view's rows, as Notion's: each dated row a bar from its
// first day to its last, placed by days from the timeline's start, under
// a row of units (days, weeks, months, quarters or years). Rows without
// a date are listed apart. Days are "YYYY-MM-DD", counted in UTC.
import type { PropertyId, TimelineOptions } from "../../../../model/index.ts";
import { readDateValue } from "../../properties/date/index.ts";
import type { TableModel, TableRow } from "../../table-model.selectors.ts";

export type TimelineZoom = TimelineOptions["zoom"];

export interface TimelineBar {
  readonly row: TableRow;
  readonly title: string;
  readonly start: string;
  readonly end: string;
  // Days from the timeline's start to the bar's first day, and how many
  // days the bar covers.
  readonly offset: number;
  readonly span: number;
}

export interface TimelineUnit {
  readonly label: string;
  readonly offset: number;
  readonly span: number;
}

export interface Timeline {
  readonly propertyId: PropertyId;
  readonly start: string;
  // How many days the timeline covers, and today's place in them.
  readonly length: number;
  readonly today: number;
  readonly units: readonly TimelineUnit[];
  // Each day's number under the units, where days are wide enough to
  // read one: zoomed to weeks or months, as Notion's.
  readonly days: readonly TimelineUnit[];
  readonly bars: readonly TimelineBar[];
  readonly undated: readonly TableRow[];
}

const DAY_MS = 86_400_000;
const WEEK = 7;
const QUARTER_MONTHS = 3;

// How far the timeline reaches before and after its rows and today.
const PADDING: Readonly<Record<TimelineZoom, number>> = {
  day: 7,
  week: 14,
  month: 31,
  quarter: 92,
  year: 366,
};

function toTime(day: string): number {
  return Date.parse(`${day}T00:00:00Z`);
}

function toDay(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toTime(to) - toTime(from)) / DAY_MS);
}

function addDays(day: string, count: number): string {
  return toDay(toTime(day) + count * DAY_MS);
}

// The first day of the unit that holds a day.
function unitStart(day: string, zoom: TimelineZoom): string {
  const date = new Date(toTime(day));
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  switch (zoom) {
    case "day":
      return day;
    case "week":
      return addDays(day, -date.getUTCDay());
    case "month":
      return toDay(Date.UTC(year, month, 1));
    case "quarter":
      return toDay(Date.UTC(year, month - (month % QUARTER_MONTHS), 1));
    case "year":
      return toDay(Date.UTC(year, 0, 1));
  }
}

// The first day of the next unit.
function nextUnit(day: string, zoom: TimelineZoom): string {
  const date = new Date(toTime(day));
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  switch (zoom) {
    case "day":
      return addDays(day, 1);
    case "week":
      return addDays(day, WEEK);
    case "month":
      return toDay(Date.UTC(year, month + 1, 1));
    case "quarter":
      return toDay(Date.UTC(year, month + QUARTER_MONTHS, 1));
    case "year":
      return toDay(Date.UTC(year + 1, 0, 1));
  }
}

const LABELS: Readonly<Record<TimelineZoom, Intl.DateTimeFormat>> = {
  day: new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "UTC" }),
  week: new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }),
  month: new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }),
  quarter: new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    timeZone: "UTC",
  }),
  year: new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "UTC" }),
};

function unitLabel(day: string, zoom: TimelineZoom): string {
  const label = LABELS[zoom].format(new Date(toTime(day)));
  if (zoom !== "quarter") return label;
  const quarter = Math.floor(Number(day.slice(5, 7)) / QUARTER_MONTHS + 1);
  return `Q${String(quarter)} ${label}`;
}

function unitsOf(start: string, end: string, zoom: TimelineZoom) {
  const units: TimelineUnit[] = [];
  for (let day = start; day < end; day = nextUnit(day, zoom)) {
    const next = nextUnit(day, zoom);
    units.push({
      label: unitLabel(day, zoom),
      offset: daysBetween(start, day),
      span: daysBetween(day, next),
    });
  }
  return units;
}

const NUMBERED_ZOOMS: ReadonlySet<TimelineZoom> = new Set(["week", "month"]);

function daysOf(start: string, length: number, zoom: TimelineZoom) {
  if (!NUMBERED_ZOOMS.has(zoom)) return [];
  return Array.from({ length }, (_, offset) => ({
    label: String(Number(addDays(start, offset).slice(8, 10))),
    offset,
    span: 1,
  }));
}

interface Dated {
  readonly row: TableRow;
  readonly start: string;
  readonly end: string;
}

function datedRows(model: TableModel, propertyId: string) {
  const dated: Dated[] = [];
  const undated: TableRow[] = [];
  for (const row of model.rows) {
    const date = readDateValue(row.values[propertyId]);
    if (date === undefined) undated.push(row);
    else dated.push({ row, start: date.start, end: date.end ?? date.start });
  }
  return { dated, undated };
}

// The view's date property, or the first one when it names none.
function dateProperty(model: TableModel) {
  const dates = model.database.props.properties.filter(
    (item) => item.type === "date",
  );
  const chosen = model.view.timeline.datePropertyId;
  return dates.find((item) => item.id === chosen) ?? dates[0];
}

export interface TimelineQuery {
  readonly zoom: TimelineZoom;
  readonly today: string;
}

export function selectTimeline(
  model: TableModel,
  query: TimelineQuery,
): Timeline | undefined {
  const property = dateProperty(model);
  if (property === undefined) return undefined;
  const { zoom, today } = query;
  const { dated, undated } = datedRows(model, property.id);
  const padding = PADDING[zoom];
  const firsts = dated.map((item) => addDays(item.start, -1));
  const lasts = dated.map((item) => addDays(item.end, padding));
  const earliest = [addDays(today, -padding), ...firsts].sort()[0] ?? today;
  const latest = [addDays(today, padding), ...lasts].sort().at(-1) ?? today;
  const start = unitStart(earliest, zoom);
  const end = nextUnit(unitStart(latest, zoom), zoom);
  const bars = dated.map((item) => ({
    row: item.row,
    title: item.row.title,
    start: item.start,
    end: item.end,
    offset: daysBetween(start, item.start),
    span: daysBetween(item.start, item.end) + 1,
  }));
  const length = daysBetween(start, end);
  return {
    propertyId: property.id,
    start,
    length,
    today: daysBetween(start, today),
    units: unitsOf(start, end, zoom),
    days: daysOf(start, length, zoom),
    bars,
    undated,
  };
}
