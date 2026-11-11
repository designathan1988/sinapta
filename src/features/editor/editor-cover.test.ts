// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { selectPage, type PageBlock } from "../../blocks/page/index.ts";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import {
  createInitialState,
  type AppState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import { COVER_POSITION_OVERLAY, renderCover } from "./editor-cover.view.ts";

const IMAGE = "https://example.com/cover.jpg";

function setup(cover: string, isRepositioning: boolean) {
  const props = {
    title: [],
    icon: null,
    isFavorite: false,
    isTrashed: false,
    cover,
    coverPosition: 50,
  };
  const initial = createInitialState();
  const overlay = isRepositioning ? { kind: COVER_POSITION_OVERLAY } : null;
  const state: AppState = {
    ...initial,
    workspace: buildWorkspace([{ id: "page", props }]),
    ui: { ...initial.ui, overlay },
  };
  const page = selectPage(state, toBlockId("page"));
  if (page === undefined) throw new Error("The builder lost the page.");
  const commands: Command[] = [];
  const dispatch: Dispatch = (command) => {
    commands.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  render(renderCover(state, page satisfies PageBlock, dispatch), host);
  return { host, commands };
}

function press(element: Element | null, key: string): void {
  element?.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

describe("renderCover", () => {
  it("offers to reposition an image cover, not a color", () => {
    const label = "Reposition";
    const buttons = (host: HTMLElement) =>
      [...host.querySelectorAll("button")].map((b) => b.textContent.trim());

    expect(buttons(setup(IMAGE, false).host)).toContain(label);
    expect(buttons(setup("ocean", false).host)).not.toContain(label);
  });

  it("moves the image with the arrow keys while repositioning", () => {
    const { host, commands } = setup(IMAGE, true);
    const slider = host.querySelector("[role=slider]");

    press(slider, "ArrowDown");
    press(slider, "Home");

    expect(commands).toEqual([
      expect.objectContaining({ type: "page.setCoverPosition", position: 55 }),
      expect.objectContaining({ type: "page.setCoverPosition", position: 0 }),
    ]);
  });

  it("counts the cover as part of the overlay while repositioning", () => {
    // A press on the image then drags it instead of ending repositioning.
    const cover = (moving: boolean) =>
      setup(IMAGE, moving).host.querySelector(".editor__cover");

    expect(cover(true)?.hasAttribute("data-overlay")).toBe(true);
    expect(cover(false)?.hasAttribute("data-overlay")).toBe(false);
  });
});
