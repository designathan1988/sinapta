// The list ":name" opens: emoji whose name matches. Focus stays in the
// text; the keys are scoped keys.
import "./emoji-menu.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { Emoji } from "../../ui/emoji/index.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import type { ScopedKeyHandler, ScopedKeys } from "../../ui/shortcuts/index.ts";
import { replaceText } from "../editor/index.ts";
import {
  selectOpenEmojiMenu,
  type OpenEmojiMenu,
} from "./emoji-menu.selectors.ts";

function choose(menu: OpenEmojiMenu, emoji: Emoji, dispatch: Dispatch): void {
  const { blockId, start, end } = menu;
  dispatch(closeOverlay.create({}));
  dispatch(replaceText.create({ blockId, start, end, text: emoji.char }));
}

function step(offset: number): ScopedKeyHandler {
  return ({ state, dispatch }) => {
    const menu = selectOpenEmojiMenu(state);
    const { overlay } = state.ui;
    if (menu === undefined || overlay === null) return;
    const count = menu.items.length;
    const activeIndex = (menu.activeIndex + offset + count) % count;
    dispatch(openOverlay.create({ overlay: { ...overlay, activeIndex } }));
    announce(menu.items[activeIndex]?.name ?? "");
  };
}

export const emojiMenuKeys: ScopedKeys = {
  isActive: (state) => selectOpenEmojiMenu(state) !== undefined,
  keys: {
    ArrowDown: step(1),
    ArrowUp: step(-1),
    Enter: ({ state, dispatch }) => {
      const menu = selectOpenEmojiMenu(state);
      const emoji = menu?.items[menu.activeIndex];
      if (menu !== undefined && emoji !== undefined) {
        choose(menu, emoji, dispatch);
      }
    },
    Escape: ({ dispatch }) => {
      dispatch(closeOverlay.create({}));
    },
  },
};

export function renderEmojiMenu(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const menu = selectOpenEmojiMenu(state);
  if (menu === undefined) return nothing;
  const onPointerDown = (event: Event): void => {
    // Keep the caret in the text.
    event.preventDefault();
    if (!(event.target instanceof Element)) return;
    const index =
      event.target.closest<HTMLElement>("[data-index]")?.dataset.index;
    const emoji = menu.items[Number(index ?? -1)];
    if (emoji !== undefined) choose(menu, emoji, dispatch);
  };
  return html`<div
    class="emoji-menu"
    role="listbox"
    tabindex="0"
    popover="manual"
    data-overlay
    aria-label=${COPY.emoji.menu}
    ${ref(showPopoverWhenConnected)}
    @pointerdown=${onPointerDown}
  >
    ${menu.items.map(
      (emoji, index) =>
        html`<div
          class="emoji-menu__item"
          role="option"
          data-index=${index}
          aria-selected=${String(index === menu.activeIndex)}
        >
          <span aria-hidden="true">${emoji.char}</span>
          <span>${emoji.name}</span>
        </div>`,
    )}
  </div>`;
}
