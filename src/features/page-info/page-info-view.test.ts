// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import {
  createInitialState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import { renderPageInfo } from "./page-info.view.ts";

function rendered(isFavorite: boolean) {
  const props = { title: [], icon: null, isFavorite, isTrashed: false };
  const initial = createInitialState();
  const state = {
    ...initial,
    workspace: buildWorkspace([{ id: "page", props }]),
    ui: { ...initial.ui, activePageId: toBlockId("page") },
  };
  const commands: Command[] = [];
  const dispatch: Dispatch = (command) => {
    commands.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  render(renderPageInfo(state, dispatch), host);
  return { host, commands };
}

describe("renderPageInfo", () => {
  it("shows whether the page is a favorite on its star", () => {
    const star = (isFavorite: boolean) =>
      rendered(isFavorite).host.querySelector("[aria-pressed]");

    expect(star(true)?.getAttribute("aria-pressed")).toBe("true");
    expect(star(false)?.getAttribute("aria-pressed")).toBe("false");
  });

  it("turns the favorite on and off from the star", () => {
    const { host, commands } = rendered(false);

    host.querySelector<HTMLElement>("[aria-pressed]")?.click();

    expect(commands).toEqual([
      expect.objectContaining({ type: "page.toggleFavorite", pageId: "page" }),
    ]);
  });

  it("opens the page's history from when it was edited, as Notion's", () => {
    const { host, commands } = rendered(false);

    host.querySelector<HTMLElement>(".page-info__edited")?.click();

    expect(commands).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "page-history", anchorId: "page" },
      }),
    ]);
  });

  it("copies the page's link from the link button", () => {
    const written: string[] = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text: string) => {
          written.push(text);
          return Promise.resolve();
        },
      },
    });
    const { host } = rendered(false);

    host.querySelector<HTMLElement>("[aria-label='Copy link']")?.click();

    expect(written).toHaveLength(1);
    expect(written[0]).toContain("page");
  });

  it("says when the page was last edited", () => {
    expect(rendered(false).host.textContent).toContain("Edited");
  });

  it("shows Suggesting while the page suggests, and turns it off", () => {
    const props = {
      title: [],
      icon: null,
      isFavorite: false,
      isTrashed: false,
    };
    const initial = createInitialState();
    const page = toBlockId("page");
    const state = {
      ...initial,
      workspace: buildWorkspace([{ id: "page", props }]),
      ui: { ...initial.ui, activePageId: page, suggestingPageId: page },
    };
    const commands: Command[] = [];
    const host = document.createElement("div");
    render(
      renderPageInfo(state, (command) => {
        commands.push(command);
        return { ok: true };
      }),
      host,
    );
    const pill = host.querySelector<HTMLElement>(".page-info__suggesting");

    expect(pill?.textContent.trim()).toBe("Suggesting");
    pill?.click();

    expect(commands).toEqual([
      expect.objectContaining({ type: "ui.setSuggesting", pageId: null }),
    ]);
  });

  it("starts without Suggesting, as after a reload", () => {
    const { host } = rendered(false);

    expect(host.querySelector(".page-info__suggesting")).toBeNull();
  });
});
