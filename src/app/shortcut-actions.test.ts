import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../model/index.ts";
import { createInitialState, type Command } from "../state/index.ts";
import { runShortcutAction } from "./shortcut-actions.ts";

const page = (title: string) => ({
  title: [{ text: title }],
  icon: null,
  isFavorite: false,
  isTrashed: false,
});

// A page inside a toggle inside a page: its parent page is the outer one.
function run(action: "new-page" | "parent-page" | "move-to") {
  const workspace = buildWorkspace([
    {
      id: "outer",
      props: page("Outer"),
      children: [
        {
          id: "toggle",
          type: "toggle",
          props: { text: [] },
          children: [{ id: "inner", props: page("Inner") }],
        },
      ],
    },
  ]);
  const initial = createInitialState();
  const state = {
    ...initial,
    workspace,
    ui: { ...initial.ui, activePageId: toBlockId("inner") },
  };
  const sent: Command[] = [];
  runShortcutAction(action, state, (command) => {
    sent.push(command);
    return { ok: true };
  });
  return sent;
}

describe("the navigation keys", () => {
  it("open the page the open page is in", () => {
    expect(run("parent-page")).toEqual([
      { type: "ui.setActivePage", pageId: "outer" },
    ]);
  });

  it("move the open page with Ctrl+Shift+P, as Notion's", () => {
    const [opened] = run("move-to");

    expect(opened).toMatchObject({
      type: "ui.openOverlay",
      overlay: { kind: "move-to", anchorId: "inner" },
    });
  });

  it("make a new page", () => {
    expect(run("new-page")).toEqual([{ type: "page.create", parentId: null }]);
  });
});
