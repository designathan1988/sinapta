// A date property's formats and a day in the Relative one, in Notion's
// words: dateHelpers.dateFormat.*, dateHelpers.*TimeFormat and
// dateFormatHelpers.text.* (n74-relative-code).
export const DATE_FORMAT_TEXT = {
  dateFormat: "Date format",
  dateFormats: {
    full: "Full date",
    short: "Short date",
    "month-day-year": "Month/Day/Year",
    "day-month-year": "Day/Month/Year",
    "year-month-day": "Year/Month/Day",
    relative: "Relative",
  },
  // A day in the Relative format (dateFormatHelpers.text.*).
  relativeDays: {
    today: "Today",
    tomorrow: "Tomorrow",
    yesterday: "Yesterday",
    next: (weekday: string) => `Next ${weekday}`,
    last: (weekday: string) => `Last ${weekday}`,
  },
  timeFormat: "Time format",
  timeFormats: { hidden: "Hidden", "12-hour": "12 hour", "24-hour": "24 hour" },
} as const;
