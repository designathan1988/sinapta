// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { buildWorkspace } from "../../model/index.ts";
import {
  createInitialState,
  type AppState,
  type Command,
} from "../../state/index.ts";
import { onBeforeInput } from "./editor-input.view.ts";

function typeInto(element: Element): { event: InputEvent; sent: Command[] } {
  const sent: Command[] = [];
  const context = {
    state: createInitialState(),
    dispatch: (command: Command) => {
      sent.push(command);
      return { ok: true } as const;
    },
  };
  const event = new InputEvent("beforeinput", {
    inputType: "insertText",
    data: "a",
    cancelable: true,
    bubbles: true,
  });
  element.addEventListener("beforeinput", (input) => {
    if (input instanceof InputEvent) onBeforeInput(input, context);
  });
  element.dispatchEvent(event);
  return { event, sent };
}

describe("onBeforeInput", () => {
  it("leaves typing in a form field inside a block to the field", () => {
    const block = document.createElement("div");
    const field = document.createElement("input");
    block.append(field);

    const { event, sent } = typeInto(field);

    expect(event.defaultPrevented).toBe(false);
    expect(sent).toEqual([]);
  });
});

// A paragraph holding `text` in the document and in the state, with the
// caret at its end, and a key typed there.
function typeAtEndSent(
  text: string,
  init: InputEventInit,
  type: string,
): Command[] {
  const block = document.createElement("div");
  block.dataset.blockId = "a";
  const element = document.createElement("p");
  element.dataset.text = "";
  element.textContent = text;
  block.append(element);
  document.body.replaceChildren(block);
  const node = element.firstChild ?? element;
  document
    .getSelection()
    ?.setBaseAndExtent(node, text.length, node, text.length);
  const initial = createInitialState();
  const workspace = buildWorkspace([
    {
      id: "page",
      children: [{ id: "a", type, props: { text: [{ text }] } }],
    },
  ]);
  const state: AppState = { ...initial, workspace };
  const sent: Command[] = [];
  const context = {
    state,
    dispatch: (command: Command) => {
      sent.push(command);
      return { ok: true } as const;
    },
  };
  const event = new InputEvent("beforeinput", {
    cancelable: true,
    bubbles: true,
    ...init,
  });
  // The test document has no target ranges; the caret is in the selection.
  Object.defineProperty(event, "target", { value: element });
  Object.defineProperty(event, "getTargetRanges", { value: () => [] });
  onBeforeInput(event, context);
  return sent;
}

function typeAtEnd(text: string, init: InputEventInit, type = "paragraph") {
  return typeAtEndSent(text, init, type).map((command) => command.type);
}

// The commands sent for a key typed at the end of a paragraph.
function typeAtEndCommands(text: string, init: InputEventInit): Command[] {
  return typeAtEndSent(text, init, "paragraph");
}

describe("inline Markdown while typing", () => {
  it("formats the text once its closing marker is typed", () => {
    const sent = typeAtEnd("**bold*", { inputType: "insertText", data: "*" });

    expect(sent).toEqual(["text.replace", "text.applyInlineMarkdown"]);
  });

  it("types an ordinary character as it is", () => {
    const sent = typeAtEnd("**bold", { inputType: "insertText", data: "*" });

    expect(sent).toEqual(["text.replace"]);
  });

  it("does nothing while an input method is composing", () => {
    const sent = typeAtEnd("**bold*", {
      inputType: "insertCompositionText",
      data: "*",
      isComposing: true,
    });

    expect(sent).toEqual([]);
  });

  it("leaves Markdown in a code block as typed", () => {
    const init = { inputType: "insertText", data: "*" };

    expect(typeAtEnd("**bold*", init, "code")).toEqual(["text.replace"]);
  });
});

describe("menus opened while typing", () => {
  function sentFor(text: string, data: string) {
    const sent = typeAtEndCommands(text, { inputType: "insertText", data });
    return sent;
  }

  it("opens the mention menu at an @", () => {
    const sent = sentFor("see ", "@");

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "mention-menu", anchorId: "a", start: 4 },
      }),
    );
  });

  it("opens the page link menu at a second [", () => {
    const sent = sentFor("see [", "[");

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "page-link-menu", anchorId: "a", start: 4 },
      }),
    );
  });

  it("opens no menu while an input method is composing", () => {
    const sent = typeAtEndCommands("see ", {
      inputType: "insertCompositionText",
      data: "@",
      isComposing: true,
    });

    expect(sent).toEqual([]);
  });
});

describe("deleting with a collapsed caret", () => {
  it("deletes the character before the caret when the browser gives no range", () => {
    const sent = typeAtEndSent(
      "see Plan",
      {
        inputType: "deleteContentBackward",
      },
      "paragraph",
    );

    expect(sent).toEqual([
      expect.objectContaining({
        type: "text.replace",
        start: 7,
        end: 8,
        text: "",
      }),
    ]);
  });
});
