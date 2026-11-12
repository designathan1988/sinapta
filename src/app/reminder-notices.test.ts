import { describe, expect, it } from "vitest";
import { buildWorkspace } from "../model/index.ts";
import { createTestApp } from "../state/index.ts";
import { checkReminders, type NoticeHost } from "./reminder-notices.ts";

function store(withReminder: boolean) {
  const text = withReminder
    ? [
        {
          text: "Call",
          mention: {
            kind: "date" as const,
            date: "2026-11-10",
            isReminder: true,
          },
        },
      ]
    : [{ text: "Nothing to remind" }];
  const workspace = buildWorkspace([
    {
      id: "page",
      props: { title: [], icon: null, isFavorite: false, isTrashed: false },
      children: [{ id: "a", type: "paragraph", props: { text } }],
    },
  ]);
  return createTestApp({ workspace }).store;
}

function host(permission: NotificationPermission) {
  const calls = { asked: 0, shown: 0 };
  const notices: NoticeHost = {
    permission: () => permission,
    ask: () => {
      calls.asked += 1;
    },
    show: () => {
      calls.shown += 1;
    },
    now: () => new Date("2026-11-11T10:00:00"),
  };
  return { notices, calls };
}

describe("reminder notices", () => {
  it("never ask to notify while there is no reminder", () => {
    const { notices, calls } = host("default");

    checkReminders(store(false), notices, new Set());

    expect(calls.asked).toBe(0);
  });

  it("ask once a reminder exists", () => {
    const { notices, calls } = host("default");

    checkReminders(store(true), notices, new Set());

    expect(calls.asked).toBe(1);
  });

  it("show a due reminder once", () => {
    const { notices, calls } = host("granted");
    const shown = new Set<string>();
    const withReminder = store(true);

    checkReminders(withReminder, notices, shown);
    checkReminders(withReminder, notices, shown);

    expect(calls.shown).toBe(1);
  });
});
