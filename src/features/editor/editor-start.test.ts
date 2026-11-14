// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import {
  createInitialState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import { createApp } from "./editor-builder.ts";
import { startPageWith } from "./editor-start.commands.ts";
import { renderStartList } from "./editor-start.view.ts";

const PAGE_PROPS = {
  title: [],
  icon: null,
  isFavorite: false,
  isTrashed: false,
};

function rendered(children: { id: string }[]) {
  const props = { title: [], icon: null, isFavorite: false, isTrashed: false };
  const state = {
    ...createInitialState(),
    workspace: buildWorkspace([{ id: "page", props, children }]),
  };
  const commands: Command[] = [];
  const dispatch: Dispatch = (command) => {
    commands.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  render(renderStartList(toBlockId("page"), { state, dispatch }), host);
  return { host, commands };
}

describe("renderStartList", () => {
  it("offers Notion's choices: Ask AI, Transcribe, Database, Form, Templates, more", () => {
    const pills = [
      ...rendered([]).host.querySelectorAll(".editor__start-pill"),
    ].map((pill) => pill.textContent.trim() || pill.getAttribute("aria-label"));

    expect(pills).toEqual([
      "Ask AI",
      "Transcribe",
      "Database",
      "Form",
      "Templates",
      "More ways to start",
    ]);
  });

  it("starts the page as a table, or with the AI prompt or meeting notes", () => {
    const { host, commands } = rendered([]);
    const press = (label: string) => {
      [...host.querySelectorAll("button")]
        .find((button) => button.textContent.trim() === label)
        ?.click();
    };

    press("Database");
    press("Ask AI");
    press("Transcribe");

    expect(commands).toMatchObject([
      { type: "database.startFromPage", pageId: "page", viewType: "table" },
      { type: "page.startWith", pageId: "page", kind: "ai" },
      { type: "page.startWith", pageId: "page", kind: "transcribe" },
    ]);
  });

  it("offers nothing once the page has content", () => {
    expect(rendered([{ id: "text" }]).host.querySelector("button")).toBeNull();
  });
});

describe("page.startWith", () => {
  it("adds a line with the AI prompt open, or AI Meeting Notes", () => {
    const app = createApp([], [{ id: "empty", props: PAGE_PROPS }]);
    const pageId = toBlockId("empty");

    app.dispatch(startPageWith.create({ pageId, kind: "ai" }));
    const state = app.store.getState();
    const [line] = state.workspace.blocks[pageId]?.childIds ?? [];
    expect(state.ui.overlay).toMatchObject({
      kind: "ai-prompt",
      anchorId: line,
    });

    app.dispatch(startPageWith.create({ pageId, kind: "transcribe" }));
    const ids = app.store.getState().workspace.blocks[pageId]?.childIds ?? [];
    const last =
      app.store.getState().workspace.blocks[ids[1] ?? toBlockId("x")];
    expect(last?.type).toBe("meeting-notes");
  });
});
