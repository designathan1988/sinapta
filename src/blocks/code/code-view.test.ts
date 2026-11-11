// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it, vi } from "vitest";
import { toBlockId } from "../../model/index.ts";
import type { Command, Dispatch } from "../../state/index.ts";
import type { CodeBlock } from "./code.schema.ts";
import { renderCode } from "./code.view.ts";

function rendered(props: Partial<CodeBlock["props"]> = {}) {
  const block: CodeBlock = {
    id: toBlockId("code"),
    type: "code",
    parentId: toBlockId("page"),
    childIds: [],
    props: { text: [{ text: "let x = 1;" }], ...props },
    createdAt: "",
    updatedAt: "",
  };
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  render(renderCode(block, dispatch), host);
  const button = (label: string) =>
    [...host.querySelectorAll("button")].find(
      (element) => element.textContent.trim() === label,
    );
  return { host, sent, button };
}

describe("renderCode", () => {
  it("sets the language chosen in the list", () => {
    const { host, sent } = rendered();
    const select = host.querySelector("select");
    if (select === null) throw new Error("no language list");

    select.value = "rust";
    select.dispatchEvent(new Event("change"));

    expect(sent).toEqual([
      expect.objectContaining({ type: "code.setLanguage", language: "rust" }),
    ]);
  });

  it("turns wrapping on from the Wrap button", () => {
    const { sent, button } = rendered();

    button("Wrap")?.click();

    expect(sent).toEqual([
      expect.objectContaining({ type: "code.toggleWrap", blockId: "code" }),
    ]);
  });

  it("copies the code", () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    rendered().button("Copy")?.click();

    expect(writeText).toHaveBeenCalledWith("let x = 1;");
  });

  it("adds a caption, and removes it once it is cleared", () => {
    const { sent, button } = rendered();
    button("Caption")?.click();
    const { host, sent: later } = rendered({ caption: [{ text: "x" }] });
    const input = host.querySelector("input");
    if (input === null) throw new Error("no caption field");

    input.value = "";
    input.dispatchEvent(new Event("change"));

    expect(sent).toEqual([
      expect.objectContaining({ type: "code.setCaption", caption: "" }),
    ]);
    expect(later).toEqual([
      expect.objectContaining({ type: "code.setCaption", caption: null }),
    ]);
  });
});
