// A date mention near today reads as Notion's does (n104-date-mention):
// "@Today", "@Tomorrow" or "@Yesterday", worked out when it is drawn, so
// yesterday's "@Today" reads "@Yesterday". Further days keep the date
// they were written with.
import { COPY } from "../copy.ts";

const TEXT = COPY.database.relativeDays;
const DAY_MS = 86_400_000;

function at(day: string): number {
  return Date.parse(`${day}T00:00:00Z`);
}

export function nearDayLabel(day: string, today: string): string | undefined {
  const by = Math.round((at(day) - at(today)) / DAY_MS);
  const words: Readonly<Record<number, string>> = {
    [-1]: TEXT.yesterday,
    0: TEXT.today,
    1: TEXT.tomorrow,
  };
  return words[by];
}

// Today on this computer's calendar, as YYYY-MM-DD.
export function localToday(): string {
  return new Date().toLocaleDateString("en-CA");
}
