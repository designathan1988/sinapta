// The events of a calendar's iCal text (RFC 5545), as far as Home's
// "Upcoming" needs them: each event's title, its day, and its time when it
// has one. Google Calendar, Outlook and iCloud all give a calendar such a
// private address.

export interface CalendarEvent {
  readonly title: string;
  // YYYY-MM-DD.
  readonly date: string;
  // HH:MM, in the time the calendar gives, or null for a whole day.
  readonly time: string | null;
}

// Lines folded by a leading space or tab are joined again.
function unfold(text: string): string[] {
  return text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
}

// "DTSTART;TZID=Europe/Lisbon:20261120T093000" or "...;VALUE=DATE:20261120".
function dayOf(value: string): Pick<CalendarEvent, "date" | "time"> | null {
  const found = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/.exec(value);
  if (found === null) return null;
  const [, year, month, day, hour, minute] = found;
  return {
    date: `${String(year)}-${String(month)}-${String(day)}`,
    time:
      hour === undefined || minute === undefined ? null : `${hour}:${minute}`,
  };
}

function unescape(value: string): string {
  return value
    .replace(/\\n/gi, " ")
    .replace(/\\([,;\\])/g, "$1")
    .trim();
}

interface Draft {
  title: string;
  day: Pick<CalendarEvent, "date" | "time"> | null;
}

function read(line: string, draft: Draft): void {
  const colon = line.indexOf(":");
  if (colon < 0) return;
  const name = line.slice(0, colon).split(";")[0]?.toUpperCase();
  const value = line.slice(colon + 1);
  if (name === "SUMMARY") draft.title = unescape(value);
  if (name === "DTSTART") draft.day = dayOf(value);
}

export function parseCalendar(text: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  let draft: Draft | null = null;
  for (const line of unfold(text)) {
    if (line === "BEGIN:VEVENT") draft = { title: "", day: null };
    else if (line === "END:VEVENT") {
      if (draft?.day != null) events.push({ title: draft.title, ...draft.day });
      draft = null;
    } else if (draft !== null) read(line, draft);
  }
  return events;
}

// The events from a day on, soonest first, at most `limit` of them.
export function upcoming(
  events: readonly CalendarEvent[],
  today: string,
  limit: number,
): CalendarEvent[] {
  return events
    .filter((event) => event.date >= today)
    .toSorted((a, b) =>
      `${a.date}${a.time ?? ""}`.localeCompare(`${b.date}${b.time ?? ""}`),
    )
    .slice(0, limit);
}
