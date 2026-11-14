// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import {
  createInitialState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import { renderHome } from "./home.view.ts";

function rendered(recent: string[]) {
  const props = {
    title: [{ text: "Alpha" }],
    icon: null,
    isFavorite: false,
    isTrashed: false,
    cover: "ocean",
  };
  const initial = createInitialState();
  const state = {
    ...initial,
    workspace: buildWorkspace([{ id: "a", props }]),
    ui: {
      ...initial.ui,
      isHomeOpen: true,
      recentPageIds: recent.map(toBlockId),
    },
  };
  const commands: Command[] = [];
  const dispatch: Dispatch = (command) => {
    commands.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  render(renderHome(state, dispatch), host);
  return { host, commands };
}

describe("renderHome", () => {
  it("opens a recently visited page from its card", () => {
    const { host, commands } = rendered(["a"]);
    const card = [...host.querySelectorAll("button")].find((button) =>
      button.textContent.includes("Alpha"),
    );

    card?.click();

    expect(commands).toEqual([
      expect.objectContaining({ type: "ui.setActivePage", pageId: "a" }),
    ]);
  });

  it("shows a card as Notion's: the cover, then the title and the time", () => {
    const card = rendered(["a"]).host.querySelector(".home__card");

    expect(
      card?.querySelector(".home__card-cover")?.getAttribute("data-cover"),
    ).toBe("ocean");
    expect(card?.querySelector(".home__card-title")?.textContent).toBe("Alpha");
    expect(card?.querySelector(".home__card-time")?.textContent).toMatch(
      /^Edited /,
    );
  });

  it("says so when nothing was visited yet", () => {
    expect(rendered([]).host.textContent).toContain("No pages visited yet");
  });
});

describe("Home's favorites", () => {
  it("shows the favorite pages as cards, and nothing when there are none", () => {
    const props = {
      title: [{ text: "Starred" }],
      icon: null,
      isTrashed: false,
    };
    const initial = createInitialState();
    const withFavorite = {
      ...initial,
      workspace: buildWorkspace([
        { id: "s", props: { ...props, isFavorite: true } },
        {
          id: "o",
          props: { ...props, title: [{ text: "Other" }], isFavorite: false },
        },
      ]),
    };
    const host = document.createElement("div");
    render(
      renderHome(withFavorite, () => ({ ok: true })),
      host,
    );

    const section = host.querySelector("[aria-labelledby=home-favorites]");
    expect(section?.textContent).toContain("Starred");
    expect(section?.textContent).not.toContain("Other");
    expect(rendered([]).host.querySelector("#home-favorites")).toBeNull();
  });
});
