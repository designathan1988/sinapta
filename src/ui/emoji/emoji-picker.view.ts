// A picker of emoji: a search field, Random and Remove, and a grid the
// arrow keys move through. Only one emoji is a Tab stop. The query lives
// in the store, passed in and reported back. For a reaction it takes
// Notion's form: "Filter…", the skin tone, every emoji twelve to a row
// and the bar of categories under the grid.
import "./emoji.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { firstGrapheme } from "../../model/index.ts";
import { COPY } from "../copy.ts";
import {
  renderCategories,
  renderReactionBar,
  renderTones,
  type ReactionParts,
} from "./emoji-reaction.view.ts";
import { emojiGroups, searchEmoji, type Emoji } from "./emoji-search.ts";
import { withSkinTone } from "./emoji-tone.ts";

export interface EmojiPickerOptions {
  readonly query: string;
  readonly onQuery: (query: string) => void;
  readonly onChoose: (emoji: string) => void;
  // Shown when there is something to remove.
  readonly onRemove?: () => void;
  // Notion's form for a reaction, with its skin tone.
  readonly reaction?: Omit<ReactionParts, "query" | "onQuery">;
}

const COLUMNS = 8;
const REACTION_COLUMNS = 12;
const SEARCH_LIMIT = 96;
const PER_GROUP = 48;

function randomEmoji(): string {
  const all = emojiGroups().flatMap((group) => group.emoji);
  return all[Math.floor(Math.random() * all.length)]?.char ?? "";
}

// The arrow keys move focus through the grid, a row at a time.
function onGridKey(event: KeyboardEvent): void {
  const target = event.currentTarget;
  const columns =
    target instanceof HTMLElement ? Number(target.dataset.columns) : COLUMNS;
  const steps: Readonly<Record<string, number>> = {
    ArrowRight: 1,
    ArrowLeft: -1,
    ArrowDown: columns,
    ArrowUp: -columns,
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

// Every emoji for a reaction, as Notion's; a few of each group else.
function shownGroups(query: string, isReaction: boolean) {
  if (query.trim() !== "") {
    const found = [...typedEmoji(query), ...searchEmoji(query, SEARCH_LIMIT)];
    return [{ name: COPY.emoji.results, emoji: found }];
  }
  return emojiGroups().map((group) => ({
    name: group.name,
    emoji: isReaction ? group.emoji : group.emoji.slice(0, PER_GROUP),
  }));
}

// The groups shown, people drawn in the chosen skin tone.
function tonedGroups(options: EmojiPickerOptions) {
  const { reaction } = options;
  const tone = reaction?.tone ?? "default";
  return shownGroups(options.query, reaction !== undefined).map((group) => ({
    name: group.name,
    emoji: group.emoji.map((emoji) => ({
      ...emoji,
      char: withSkinTone(emoji.char, tone),
    })),
  }));
}

function renderGrid(options: EmojiPickerOptions): TemplateResult {
  const { reaction } = options;
  const groups = tonedGroups(options);
  // The first emoji shown is the grid's one Tab stop.
  const first = groups.flatMap((group) => group.emoji)[0];
  const onClick = (event: Event): void => {
    if (!(event.target instanceof Element)) return;
    const choice = event.target.closest<HTMLElement>("[data-emoji]");
    if (choice?.dataset.emoji !== undefined)
      options.onChoose(choice.dataset.emoji);
  };
  const columns = reaction === undefined ? COLUMNS : REACTION_COLUMNS;
  return html`<div
    class="emoji__grid"
    data-columns=${columns}
    @click=${onClick}
    @keydown=${onGridKey}
  >
    ${groups.map(
      (group) =>
        html`<p class="emoji__group" data-group=${group.name}>${group.name}</p>
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

// Enter in the search chooses the first emoji shown, as Notion's.
function chooseFirstOnEnter(options: EmojiPickerOptions) {
  return (event: KeyboardEvent): void => {
    if (event.key !== "Enter" || event.isComposing) return;
    const first = tonedGroups(options).flatMap((group) => group.emoji)[0];
    if (first === undefined) return;
    event.preventDefault();
    options.onChoose(first.char);
  };
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
      @keydown=${chooseFirstOnEnter(options)}
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
  const { reaction } = options;
  if (reaction === undefined) {
    return html`<div class="emoji">
      ${renderBar(options)} ${renderGrid(options)}
    </div>`;
  }
  const parts = { ...reaction, query: options.query, onQuery: options.onQuery };
  return html`<div class="emoji" data-variant="reaction">
    ${renderReactionBar(parts)} ${renderTones(parts)} ${renderGrid(options)}
    ${renderCategories(emojiGroups().map((group) => group.name))}
  </div>`;
}
