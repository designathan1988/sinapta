// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  BLOCK_CLIPBOARD_TYPE,
  serializeBlockClipboard,
  toBlockId,
} from "../../model/index.ts";
import type { AppState, Command } from "../../state/index.ts";
import { createApp, text } from "./editor-builder.ts";
import { pasteLines } from "./editor-paste.commands.ts";
import { pasteInto } from "./editor-paste.view.ts";

// Pastes clipboard data into block "a" between two offsets, and returns
// what was sent.
interface PasteOptions {
  readonly range?: { start: number; end: number };
  readonly value?: string;
  readonly clipboard?: AppState["ui"]["clipboard"];
}

function paste(
  data: Readonly<Record<string, string>>,
  options: PasteOptions = {},
): Command[] {
  const {
    range = { start: 0, end: 0 },
    value = "",
    clipboard = null,
  } = options;
  const { store } = createApp([text("a", value)]);
  const initial = store.getState();
  const state = { ...initial, ui: { ...initial.ui, clipboard } };
  const transfer = new DataTransfer();
  for (const [type, content] of Object.entries(data)) {
    transfer.setData(type, content);
  }
  // Browsers give a paste no data of its own; the clipboard has it.
  const event = new InputEvent("beforeinput", {
    inputType: "insertFromPaste",
    data: null,
    dataTransfer: transfer,
  });
  const sent: Command[] = [];
  const dispatch = (command: Command) => {
    sent.push(command);
    return { ok: true } as const;
  };
  const target = { blockId: toBlockId("a"), ...range };
  pasteInto(target, event, { state, dispatch });
  return sent;
}

describe("pasteInto", () => {
  it("pastes a web page's headings and lists as blocks", () => {
    const sent = paste({
      "text/html": "<h2>Plan</h2><ul><li>one</li></ul>",
      "text/plain": "Plan\none",
    });

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      type: "block.pasteBlocks",
      blocks: [
        { kind: "heading", level: 2 },
        { kind: "bulleted-list", depth: 0 },
      ],
    });
  });

  it("pastes blocks copied in Pagecraft with their kinds and nesting", () => {
    const copied = [
      { kind: "toggle", depth: 0, text: [{ text: "Plan" }] },
      { kind: "to-do", depth: 1, text: [{ text: "Ship" }], isChecked: true },
      { kind: "no-such-type", depth: 0, text: [{ text: "?" }] },
    ];
    const sent = paste({
      [BLOCK_CLIPBOARD_TYPE]: serializeBlockClipboard(copied),
      "text/plain": "Plan\nShip",
    });

    expect(sent[0]).toMatchObject({
      type: "block.pasteBlocks",
      blocks: copied.slice(0, 2),
    });
  });

  it("pastes an image copied from a web page as an image block", () => {
    const sent = paste({
      "text/html": '<img src="https://example.com/a.png">',
    });

    expect(sent[0]).toMatchObject({
      type: "block.pasteBlocks",
      blocks: [{ kind: "image", src: "https://example.com/a.png" }],
    });
  });

  it("links the selected text to a pasted address", () => {
    const sent = paste(
      { "text/plain": "https://example.com" },
      { range: { start: 0, end: 5 }, value: "Hello world" },
    );

    expect(sent).toEqual([
      expect.objectContaining({
        type: "text.setLink",
        start: 0,
        end: 5,
        href: "https://example.com",
      }),
    ]);
  });

  it("pastes an address on its own as a link", () => {
    const sent = paste({ "text/plain": "https://example.com" });

    expect(sent[0]).toMatchObject({
      type: "block.pasteLines",
      lines: [[{ text: "https://example.com", href: "https://example.com/" }]],
    });
  });
});

describe("pasting many lines", () => {
  it("pastes 5,000 lines in under half a second", () => {
    const lines = Array.from({ length: 5000 }, (_, i) => `line ${String(i)}`);
    const { dispatch, store } = createApp([text("a", "")]);
    const started = performance.now();

    dispatch(
      pasteLines.create({
        blockId: toBlockId("a"),
        start: 0,
        end: 0,
        lines: lines.map((line) => [{ text: line }]),
      }),
    );

    expect(performance.now() - started).toBeLessThan(500);
    expect(
      store.getState().workspace.blocks[toBlockId("page")]?.childIds,
    ).toHaveLength(5000);
  });
});

describe("pasting blocks copied with Ctrl+C", () => {
  it("rebuilds the copied blocks when the pasted text is theirs", () => {
    const blocks = [{ kind: "quote", depth: 0, text: [{ text: "Said" }] }];
    const sent = paste(
      { "text/plain": "Said" },
      { clipboard: { text: "Said", blocks } },
    );

    expect(sent[0]).toMatchObject({ type: "block.pasteBlocks", blocks });
  });
});
