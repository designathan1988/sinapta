import { describe, expect, it } from "vitest";
import { parseCalendar, upcoming } from "./ical.ts";

describe("parseCalendar", () => {
  it("reads folded lines and escaped text", () => {
    const text = [
      "BEGIN:VEVENT",
      "SUMMARY:Plan\\, ship",
      " and celebrate",
      "DTSTART:20261121T180000Z",
      "END:VEVENT",
    ].join("\r\n");

    expect(parseCalendar(text)).toEqual([
      { title: "Plan, shipand celebrate", date: "2026-11-21", time: "18:00" },
    ]);
  });

  it("skips an event with no start", () => {
    expect(parseCalendar("BEGIN:VEVENT\nSUMMARY:Someday\nEND:VEVENT")).toEqual(
      [],
    );
  });
});

describe("upcoming", () => {
  it("keeps today's and later events, soonest first, up to a limit", () => {
    const events = [
      { title: "B", date: "2026-11-15", time: "10:00" },
      { title: "A", date: "2026-11-15", time: "09:00" },
      { title: "Old", date: "2026-11-13", time: null },
      { title: "C", date: "2026-11-30", time: null },
    ];

    expect(upcoming(events, "2026-11-14", 2).map((each) => each.title)).toEqual(
      ["A", "B"],
    );
  });
});
