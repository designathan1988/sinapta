import { describe, expect, it } from "vitest";
import { buildWorkspace } from "../model/index.ts";
import { createInitialState, type Command } from "../state/index.ts";
import { runTemplateRepeats } from "./template-repeats.ts";

// A database with one template that repeats daily from the 12th.
function state() {
  const workspace = buildWorkspace([
    {
      id: "tasks",
      type: "database",
      props: {
        title: [{ text: "Tasks" }],
        icon: null,
        isFavorite: false,
        isTrashed: false,
        properties: [],
        viewIds: [],
        templateIds: ["standup"],
        defaultTemplateId: null,
      },
      children: [
        {
          id: "standup",
          props: {
            title: [{ text: "Standup" }],
            icon: null,
            isFavorite: false,
            isTrashed: false,
            values: {},
            repeat: { every: "day", next: "2026-11-12" },
          },
        },
      ],
    },
  ]);
  return { ...createInitialState(), workspace };
}

function run(today: string): Command[] {
  const sent: Command[] = [];
  runTemplateRepeats(state(), { today }, (command) => {
    sent.push(command);
    return { ok: true };
  });
  return sent;
}

describe("runTemplateRepeats", () => {
  it("adds a due template's row where it is, then moves it on", () => {
    expect(run("2026-11-12")).toEqual([
      expect.objectContaining({
        type: "row.add",
        databaseId: "tasks",
        staysPut: true,
        template: { id: "standup", blockCount: 1 },
      }),
      expect.objectContaining({
        type: "template.advanceRepeat",
        templateId: "standup",
        today: "2026-11-12",
      }),
    ]);
  });

  it("does nothing before the day", () => {
    expect(run("2026-11-11")).toEqual([]);
  });
});
