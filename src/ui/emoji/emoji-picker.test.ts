// @vitest-environment happy-dom
import { render } from "lit-html";
import { beforeAll, describe, expect, it } from "vitest";
import type { SkinTone } from "../../model/index.ts";
import {
  renderEmojiPicker,
  type EmojiPickerOptions,
} from "./emoji-picker.view.ts";
import { loadEmoji as loadEmojiList } from "./emoji-search.ts";

beforeAll(async () => {
  await loadEmojiList();
});

function rendered(overrides: Partial<EmojiPickerOptions> = {}) {
  const chosen: string[] = [];
  const queries: string[] = [];
  const options: EmojiPickerOptions = {
    query: "",
    onQuery: (query) => queries.push(query),
    onChoose: (emoji) => chosen.push(emoji),
    ...overrides,
  };
  const host = document.createElement("div");
  render(renderEmojiPicker(options), host);
  return { host, chosen, queries };
}

describe("renderEmojiPicker", () => {
  it("shows the emoji that match the query and chooses one on click", () => {
    const { host, chosen } = rendered({ query: "rocket" });
    const first = host.querySelector<HTMLElement>("[data-emoji]");

    first?.click();

    expect(chosen).toEqual(["🚀"]);
  });

  it("reports what is typed in its search field", () => {
    const { host, queries } = rendered();
    const field = host.querySelector("input");
    if (field === null) throw new Error("The picker has no search field.");

    field.value = "cat";
    field.dispatchEvent(new Event("input", { bubbles: true }));

    expect(queries).toEqual(["cat"]);
  });

  it("lets only one emoji be reached with Tab", () => {
    const { host } = rendered();
    const stops = host.querySelectorAll('[data-emoji][tabindex="0"]');

    expect(stops).toHaveLength(1);
  });

  it("offers an emoji pasted into the search field first", () => {
    const { host } = rendered({ query: "🦊" });

    expect(host.querySelector<HTMLElement>("[data-emoji]")?.dataset.emoji).toBe(
      "🦊",
    );
  });
});

// Notion's picker for a reaction, its tones open when asked; a query keeps
// the grid short where the whole list is not the point.
function reactionPicker(
  isChoosingTone = false,
  tone: SkinTone = "default",
  query = "",
) {
  const sent: string[] = [];
  const host = document.createElement("div");
  render(
    renderEmojiPicker({
      query,
      onQuery: () => undefined,
      onChoose: (emoji) => sent.push(`choose ${emoji}`),
      reaction: {
        tone,
        isChoosingTone,
        onToggleTones: () => sent.push("toggle"),
        onTone: (chosen) => sent.push(`tone ${chosen}`),
      },
    }),
    host,
  );
  return { host, sent };
}

describe("the emoji picker for a reaction", () => {
  it("shows Filter…, the hand, twelve to a row and the categories", () => {
    const { host } = reactionPicker();
    const labels = [...host.querySelectorAll(".emoji__category")].map(
      (button) => button.getAttribute("title"),
    );

    expect(host.querySelector("input")?.placeholder).toBe("Filter…");
    expect(host.querySelector(".emoji__tone")?.textContent.trim()).toBe("✋");
    expect(
      host.querySelector(".emoji__grid")?.getAttribute("data-columns"),
    ).toBe("12");
    expect(labels).toEqual([
      "Recent",
      "People",
      "Animals & nature",
      "Food & drink",
      "Activity",
      "Travel & places",
      "Objects",
      "Symbols",
      "Flags",
    ]);
  });

  it("opens the hand's tones and chooses one", () => {
    const closed = reactionPicker(false, "default", "rocket");
    closed.host.querySelector<HTMLElement>(".emoji__tone")?.click();
    expect(closed.sent).toEqual(["toggle"]);

    const open = reactionPicker(true, "default", "rocket");
    const tones = [
      ...open.host.querySelectorAll<HTMLElement>(".emoji__tones button"),
    ];
    tones[3]?.click();
    expect(tones).toHaveLength(6);
    expect(open.sent).toEqual(["tone medium"]);
  });

  it("draws people in the chosen tone and reacts with it", () => {
    const { host, sent } = reactionPicker(false, "dark", "thumbs up");
    const thumbs = host.querySelector<HTMLElement>('[data-emoji="👍🏿"]');

    thumbs?.click();

    expect(sent).toEqual(["choose 👍🏿"]);
  });
});
