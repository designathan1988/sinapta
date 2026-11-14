import { describe, expect, it } from "vitest";
import { isTextBlock, textOf } from "../../blocks/index.ts";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import {
  aiCommands,
  answerAi,
  askAi,
  createTestApp,
  discardAi,
  sendChat,
  UNDO_COMMAND,
} from "../../state/index.ts";
import {
  aiFeatureCommands,
  answerLineCount,
  insertAiBelow,
  replaceWithAi,
} from "./ai.commands.ts";

const PAGE = toBlockId("page");
const LINE = toBlockId("line");
const ANSWER = "First point\n\nSecond point\n";

function answeredApp() {
  const workspace = buildWorkspace([
    {
      id: "page",
      props: { title: [{ text: "Notes" }], icon: null, isTrashed: false },
      children: [
        { id: "line", type: "paragraph", props: { text: [{ text: "Hi" }] } },
        { id: "end", type: "paragraph", props: { text: [{ text: "End" }] } },
      ],
    },
  ]);
  const app = createTestApp({
    workspace,
    commands: [...aiCommands, ...aiFeatureCommands],
  });
  app.dispatch(askAi.create({ blockId: LINE, action: "longer", text: "Hi" }));
  app.dispatch(answerAi.create({ answer: ANSWER, error: null }));
  return app;
}

function pageTexts(app: ReturnType<typeof answeredApp>): string[] {
  const { blocks } = app.store.getState().workspace;
  return (blocks[PAGE]?.childIds ?? []).map((id) => {
    const block = blocks[id];
    return isTextBlock(block) ? textOf(block) : "";
  });
}

describe("Notion AI's answer", () => {
  it("is inserted below its block, one paragraph per line, and the panel closes", () => {
    const app = answeredApp();
    const lineCount = answerLineCount(ANSWER);

    app.dispatch(insertAiBelow.create({ lineCount }));

    expect(lineCount).toBe(2);
    expect(pageTexts(app)).toEqual([
      "Hi",
      "First point",
      "Second point",
      "End",
    ]);
    expect(app.store.getState().persistence.ai.status).toBe("idle");
  });

  it("replaces its block's text, undone in one step", () => {
    const app = answeredApp();

    app.dispatch(replaceWithAi.create({}));
    const replaced = pageTexts(app);
    app.dispatch({ type: UNDO_COMMAND });

    expect(replaced).toEqual(["First point Second point", "End"]);
    expect(pageTexts(app)).toEqual(["Hi", "End"]);
  });

  it("is discarded, leaving the page as it was", () => {
    const app = answeredApp();

    app.dispatch(discardAi.create({}));

    const { ai } = app.store.getState().persistence;
    expect(ai).toMatchObject({ status: "idle", answer: "", blockId: null });
    expect(ai.requestCount).toBe(1);
    expect(pageTexts(app)).toEqual(["Hi", "End"]);
  });
});

describe("the AI chat", () => {
  it("keeps the message, asks, then keeps the answer", () => {
    const { store, dispatch } = createTestApp({ commands: aiCommands });

    dispatch(sendChat.create({ text: "What is due?" }));
    const asking = store.getState().persistence.ai.status;
    dispatch(answerAi.create({ answer: "Nothing today.", error: null }));

    expect(asking).toBe("thinking");
    expect(store.getState().persistence.ai.chat).toEqual([
      { from: "you", text: "What is due?" },
      { from: "ai", text: "Nothing today." },
    ]);
  });

  it("sends nothing empty, nor while an answer is coming", () => {
    const { store, dispatch } = createTestApp({ commands: aiCommands });

    dispatch(sendChat.create({ text: "  " }));
    dispatch(sendChat.create({ text: "One" }));
    dispatch(sendChat.create({ text: "Two" }));

    expect(store.getState().persistence.ai.chat).toEqual([
      { from: "you", text: "One" },
    ]);
  });

  it("says when the answer failed", () => {
    const { store, dispatch } = createTestApp({ commands: aiCommands });

    dispatch(sendChat.create({ text: "Hello" }));
    dispatch(answerAi.create({ answer: null, error: "model-missing" }));

    expect(store.getState().persistence.ai.chat.at(-1)).toEqual({
      from: "failed",
      text: "model-missing",
    });
  });
});
