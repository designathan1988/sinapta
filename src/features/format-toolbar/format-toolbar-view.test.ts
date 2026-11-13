// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import {
  createInitialState,
  type AppState,
  type Command,
  type OpenOverlay,
} from "../../state/index.ts";
import { panelPlace } from "./format-toolbar-place.ts";
import { renderFormatToolbar } from "./format-toolbar.view.ts";

const A = toBlockId("a");

// "Hello world" in a paragraph with "world" selected.
function rendered(overlay: OpenOverlay | null = null) {
  const workspace = buildWorkspace([
    {
      id: "page",
      children: [
        {
          id: "a",
          type: "paragraph",
          props: { text: [{ text: "Hello world" }] },
        },
      ],
    },
  ]);
  const initial = createInitialState();
  const selection = { blockId: A, anchorOffset: 6, focusOffset: 11 };
  const state: AppState = {
    ...initial,
    workspace,
    ui: { ...initial.ui, selection, overlay },
  };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderFormatToolbar(state, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const button = (label: string) =>
    host.querySelector<HTMLElement>(`[aria-label="${label}"]`);
  return { host, sent, button };
}

const RANGE = { blockId: A, start: 6, end: 11 };

describe("the selection panel", () => {
  it("lays out Notion's rows: type, two rows of tools, then Comment and Add reaction", () => {
    const { host } = rendered();
    const controls = [...host.querySelectorAll("button")].map(
      (item) => item.getAttribute("aria-label") ?? item.textContent.trim(),
    );

    expect(controls).toEqual([
      "Turn into: Text",
      "Color",
      "Bold",
      "Italic",
      "Underline",
      "Clear formatting",
      "Link",
      "Strikethrough",
      "Inline code",
      "Equation",
      "More",
      "Comment",
      "Add reaction",
    ]);
  });

  it("dispatches each button's command over the selected range", () => {
    const { sent, button } = rendered();

    button("Bold")?.click();
    button("Clear formatting")?.click();
    button("Equation")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "text.toggleMark",
        ...RANGE,
        mark: "bold",
      }),
      expect.objectContaining({ type: "text.clearFormat", ...RANGE }),
      expect.objectContaining({ type: "text.makeEquation", ...RANGE }),
    ]);
  });

  it("opens the types to turn into with the selection kept", () => {
    const { sent, button } = rendered();

    button("Turn into: Text")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "turn-into", anchorId: A, ...RANGE },
      }),
    ]);
  });

  it("stays while the types to turn into are open", () => {
    const { host } = rendered({ kind: "turn-into", anchorId: A, ...RANGE });

    expect(host.querySelector(".format-toolbar")).not.toBeNull();
  });

  it("names each button and its keys for the pointer's hint", () => {
    const { button } = rendered();

    expect(button("Bold")?.dataset.tooltip).toBe("Bold Ctrl+B");
    expect(button("Link")?.getAttribute("aria-keyshortcuts")).toBe("Ctrl+K");
  });
});

describe("panelPlace", () => {
  const window = { width: 1440, height: 900 };
  const panel = { width: 200, height: 160 };

  it("goes under the text, its middle over the text's", () => {
    const text = { left: 600, top: 300, width: 100, height: 20 };

    expect(panelPlace(text, panel, window)).toEqual({ x: 550, y: 328 });
  });

  it("stays inside the window at its right edge, and goes over text near the bottom", () => {
    const text = { left: 1400, top: 820, width: 30, height: 20 };

    expect(panelPlace(text, panel, window)).toEqual({ x: 1232, y: 652 });
  });
});
