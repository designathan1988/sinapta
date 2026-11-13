import { describe, expect, it } from "vitest";
import { selectPage } from "../../blocks/page/index.ts";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import { replaceText } from "../editor/index.ts";
import { commentCommands } from "./comment.commands.ts";
import {
  acceptSuggestionCommand,
  rejectSuggestionCommand,
  setSuggesting,
  suggestionCommands,
} from "./suggestion.commands.ts";

const page = toBlockId("page");
const line = toBlockId("t");

// A page with one line, "Hello", in Suggesting.
function createApp() {
  const workspace = buildWorkspace([
    {
      id: "page",
      props: { title: [], icon: null, isFavorite: false, isTrashed: false },
      children: [
        { id: "t", type: "paragraph", props: { text: [{ text: "Hello" }] } },
      ],
    },
  ]);
  const app = createTestApp({
    workspace,
    commands: [...commentCommands, ...suggestionCommands, replaceText],
  });
  app.dispatch(setSuggesting.create({ pageId: page }));
  const text = () => app.store.getState().workspace.blocks[line]?.props.text;
  const discussions = () =>
    selectPage(app.store.getState(), page)?.props.discussions ?? [];
  const type = (at: number, typed: string) =>
    app.dispatch(
      replaceText.create({ blockId: line, start: at, end: at, text: typed }),
    );
  return { app, text, discussions, type };
}

describe("Suggesting", () => {
  it("keeps typing as one suggested insertion, accepted", () => {
    const { app, text, discussions, type } = createApp();

    type(5, " z");
    type(7, "z");
    const [held] = discussions();
    if (held === undefined) throw new Error("no discussion");
    app.dispatch(
      acceptSuggestionCommand.create({ pageId: page, discussionId: held.id }),
    );

    expect(discussions()).toEqual([]);
    expect(text()).toEqual([{ text: "Hello zz" }]);
  });

  it("strikes deleted text until rejected", () => {
    const { app, text, discussions } = createApp();

    app.dispatch(
      replaceText.create({ blockId: line, start: 4, end: 5, text: "" }),
    );
    expect(text()).toEqual([
      { text: "Hell" },
      expect.objectContaining({ text: "o", suggestion: "delete" }),
    ]);
    const [held] = discussions();
    if (held === undefined) throw new Error("no discussion");
    app.dispatch(
      rejectSuggestionCommand.create({ pageId: page, discussionId: held.id }),
    );

    expect(text()).toEqual([{ text: "Hello" }]);
  });

  it("edits as usual once Suggesting is off", () => {
    const { app, text, discussions, type } = createApp();
    app.dispatch(setSuggesting.create({ pageId: null }));

    type(5, "!");

    expect(text()).toEqual([{ text: "Hello!" }]);
    expect(discussions()).toEqual([]);
  });
});

describe("Delete in Suggesting", () => {
  it("strikes on forward, one suggestion, the caret past what it struck", () => {
    const { app, text, discussions } = createApp();
    const forward = (at: number) =>
      app.dispatch(
        replaceText.create({
          blockId: line,
          start: at,
          end: at + 1,
          text: "",
          isForward: true,
        }),
      );

    forward(0);
    const caret = app.store.getState().ui.selection?.focusOffset ?? -1;
    forward(caret);

    expect(caret).toBe(1);
    expect(text()).toEqual([
      expect.objectContaining({ text: "He", suggestion: "delete" }),
      { text: "llo" },
    ]);
    expect(discussions()).toHaveLength(1);
  });
});
