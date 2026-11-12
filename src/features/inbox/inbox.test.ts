import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import {
  createInitialState,
  restoreUi,
  toPersistedUi,
  type AppState,
} from "../../state/index.ts";
import { createTestApp } from "../../state/index.ts";
import { inboxCommands, markRemindersRead } from "./inbox.commands.ts";
import { selectReminders } from "./inbox.selectors.ts";

const TODAY = "2026-11-11";
const reminder = (date: string) => ({
  text: date,
  mention: { kind: "date" as const, date, isReminder: true },
});

function workspace() {
  return buildWorkspace([
    {
      id: "page",
      props: {
        title: [{ text: "Plans" }],
        icon: null,
        isFavorite: false,
        isTrashed: false,
      },
      children: [
        {
          id: "due",
          type: "paragraph",
          props: { text: [{ text: "Call Ana " }, reminder("2026-11-10")] },
        },
        {
          id: "later",
          type: "paragraph",
          props: { text: [reminder("2026-11-20")] },
        },
        {
          id: "date",
          type: "paragraph",
          props: {
            text: [
              { text: "x", mention: { kind: "date", date: "2026-11-01" } },
            ],
          },
        },
      ],
    },
  ]);
}

function state(): AppState {
  return { ...createInitialState(), workspace: workspace() };
}

describe("the inbox", () => {
  it("lists the reminders that are due, with their page and text", () => {
    expect(selectReminders(state(), TODAY)).toEqual([
      {
        key: "due:2026-11-10",
        blockId: "due",
        pageId: "page",
        pageTitle: "Plans",
        date: "2026-11-10",
        text: "Call Ana 2026-11-10",
        isRead: false,
      },
    ]);
  });

  it("keeps what was read across a reload", () => {
    const app = createTestApp({
      workspace: workspace(),
      commands: inboxCommands,
    });

    app.dispatch(markRemindersRead.create({ keys: ["due:2026-11-10"] }));

    const ui = restoreUi(toPersistedUi(app.store.getState().ui));
    const reloaded = { ...state(), ui };
    expect(selectReminders(reloaded, TODAY)[0]?.isRead).toBe(true);
    expect(toBlockId("due")).toBe("due");
  });
});
