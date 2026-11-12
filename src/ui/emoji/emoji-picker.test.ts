// @vitest-environment happy-dom
import { render } from "lit-html";
import { beforeAll, describe, expect, it } from "vitest";
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
