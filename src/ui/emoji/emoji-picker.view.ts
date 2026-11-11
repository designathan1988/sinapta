// A picker of emoji: a search field, Random and Remove, and a grid the
// arrow keys move through. Only one emoji is a Tab stop. The query lives
// in the store, passed in and reported back.
import "./emoji.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { firstGrapheme } from "../../model/index.ts";
import { COPY } from "../copy.ts";
import { emojiGroups, searchEmoji, type Emoji } from "./emoji-search.ts";

export interface EmojiPickerOptions {
  readonly query: string;
  readonly onQuery: (query: string) => void;
  readonly onChoose: (emoji: string) => void;
  // Shown when there is something to remove.
  readonly onRemove?: () => void;
}

const COLUMNS = 8;
const SEARCH_LIMIT = 96;
const PER_GROUP = 48;

function randomEmoji(): string {
  const all = emojiGroups().flatMap((group) => group.emoji);
  return all[Math.floor(Math.random() * all.length)]?.char ?? "";
}

// The arrow keys move focus through the grid, eight to a row.
function onGridKey(event: KeyboardEvent): void {
  const steps: Readonly<Record<string, number>> = {
    ArrowRight: 1,
    ArrowLeft: -1,
    ArrowDown: COLUMNS,
    ArrowUp: -COLUMNS,
  };
  const step = steps[event.key];
  if (step === undefined || !(event.currentTarget instanceof Element)) return;
  const buttons = [
    ...event.currentTarget.querySelectorAll<HTMLElement>("[data-emoji]"),
  ];
  const current = buttons.findIndex((button) => button === event.target);
  const next =
    buttons[Math.max(0, Math.min(buttons.length - 1, current + step))];
  event.preventDefault();
  next?.focus();
}

function renderEmojiButton(emoji: Emoji, isTabStop: boolean): TemplateResult {
  return html`<button
    type="button"
    class="emoji__choice"
    data-emoji=${emoji.char}
    tabindex=${isTabStop ? "0" : "-1"}
    aria-label=${emoji.name}
    title=${emoji.name}
  >
    ${emoji.char}
  </button>`;
}

const PICTOGRAPH = /\p{Extended_Pictographic}/u;

// An emoji typed or pasted into the search field is offered as it is.
function typedEmoji(query: string): Emoji[] {
  const typed = firstGrapheme(query.trim());
  return PICTOGRAPH.test(typed) ? [{ char: typed, name: typed }] : [];
}

function shownGroups(query: string) {
  if (query.trim() !== "") {
    const found = [...typedEmoji(query), ...searchEmoji(query, SEARCH_LIMIT)];
    return [{ name: COPY.emoji.results, emoji: found }];
  }
  return emojiGroups().map((group) => ({
    name: group.name,
    emoji: group.emoji.slice(0, PER_GROUP),
  }));
}

function renderGrid(options: EmojiPickerOptions): TemplateResult {
  const groups = shownGroups(options.query);
  // The first emoji shown is the grid's one Tab stop.
  const first = groups.flatMap((group) => group.emoji)[0];
  const onClick = (event: Event): void => {
    if (!(event.target instanceof Element)) return;
    const choice = event.target.closest<HTMLElement>("[data-emoji]");
    if (choice?.dataset.emoji !== undefined)
      options.onChoose(choice.dataset.emoji);
  };
  return html`<div class="emoji__grid" @click=${onClick} @keydown=${onGridKey}>
    ${groups.map(
      (group) =>
        html`<p class="emoji__group">${group.name}</p>
          <div class="emoji__row">
            ${group.emoji.map((emoji) => renderEmojiButton(emoji, emoji === first))}
          </div>`,
    )}
    ${
      first === undefined
        ? html`<p class="emoji__empty">${COPY.emoji.none}</p>`
        : nothing
    }
  </div>`;
}

function renderBar(options: EmojiPickerOptions): TemplateResult {
  const onInput = (event: Event): void => {
    if (event.target instanceof HTMLInputElement) {
      options.onQuery(event.target.value);
    }
  };
  return html`<div class="emoji__bar">
    <input
      class="emoji__search"
      type="search"
      aria-label=${COPY.emoji.search}
      placeholder=${COPY.emoji.search}
      .value=${options.query}
      data-autofocus
      @input=${onInput}
    />
    <button
      type="button"
      class="button"
      @click=${() => {
        options.onChoose(randomEmoji());
      }}
    >
      ${COPY.emoji.random}
    </button>
    ${
      options.onRemove === undefined
        ? nothing
        : html`<button type="button" class="button" @click=${options.onRemove}>
            ${COPY.emoji.remove}
          </button>`
    }
  </div>`;
}

export function renderEmojiPicker(options: EmojiPickerOptions): TemplateResult {
  return html`<div class="emoji">
    ${renderBar(options)} ${renderGrid(options)}
  </div>`;
}
