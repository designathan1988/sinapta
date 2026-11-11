// The menu that "@" and "[[" open: pages and dates to mention. Focus stays
// in the text, as with the slash menu; its keys are scoped keys.
import "./mention-menu.css";
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
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import type { ScopedKeyHandler, ScopedKeys } from "../../ui/shortcuts/index.ts";
import { insertMentionAt } from "../editor/index.ts";
import {
  selectOpenMentionMenu,
  type MentionItem,
  type OpenMentionMenu,
} from "./mention-menu.selectors.ts";

// Dates are offered from the viewer's today.
function today(): string {
  return new Date().toLocaleDateString("en-CA");
}

function choose(
  menu: OpenMentionMenu,
  item: MentionItem,
  dispatch: Dispatch,
): void {
  const { blockId, start, end } = menu;
  dispatch(closeOverlay.create({}));
  dispatch(insertMentionAt.create({ blockId, start, end, span: item.span }));
}

function highlight(
  state: AppState,
  menu: OpenMentionMenu,
  { offset, dispatch }: { offset: number; dispatch: Dispatch },
): void {
  const { overlay } = state.ui;
  if (overlay === null) return;
  const count = menu.items.length;
  const activeIndex = (menu.activeIndex + offset + count) % count;
  dispatch(openOverlay.create({ overlay: { ...overlay, activeIndex } }));
  announce(menu.items[activeIndex]?.label ?? "");
}

function onMenu(
  action: (menu: OpenMentionMenu, state: AppState, dispatch: Dispatch) => void,
): ScopedKeyHandler {
  return ({ state, dispatch }) => {
    const menu = selectOpenMentionMenu(state, today());
    if (menu !== undefined) action(menu, state, dispatch);
  };
}

export const mentionMenuKeys: ScopedKeys = {
  isActive: (state) => selectOpenMentionMenu(state, today()) !== undefined,
  keys: {
    ArrowDown: onMenu((menu, state, dispatch) => {
      highlight(state, menu, { offset: 1, dispatch });
    }),
    ArrowUp: onMenu((menu, state, dispatch) => {
      highlight(state, menu, { offset: -1, dispatch });
    }),
    Enter: onMenu((menu, _state, dispatch) => {
      const item = menu.items[menu.activeIndex];
      if (item !== undefined) choose(menu, item, dispatch);
    }),
    Escape: ({ dispatch }) => {
      dispatch(closeOverlay.create({}));
    },
  },
};

function renderOption(
  item: MentionItem,
  index: number,
  isActive: boolean,
): TemplateResult {
  const isDate = item.span.mention?.kind === "date";
  return html`<div
    class="mention-menu__item"
    role="option"
    data-index=${index}
    aria-selected=${String(isActive)}
    ${ref((option) => {
      if (isActive) option?.scrollIntoView({ block: "nearest" });
    })}
  >
    <span>${item.label}</span>
    ${
      isDate
        ? html`<span class="mention-menu__detail">${item.span.text}</span>`
        : nothing
    }
  </div>`;
}

export function renderMentionMenu(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const menu = selectOpenMentionMenu(state, today());
  if (menu === undefined) return nothing;
  const onPointerDown = (event: Event): void => {
    // Keep the caret in the text.
    event.preventDefault();
    if (!(event.target instanceof Element)) return;
    const index =
      event.target.closest<HTMLElement>("[data-index]")?.dataset.index;
    const item = menu.items[Number(index ?? -1)];
    if (item !== undefined) choose(menu, item, dispatch);
  };
  return html`<div
    class="mention-menu"
    role="listbox"
    tabindex="0"
    popover="manual"
    data-overlay
    aria-label=${COPY.mentionMenu.label}
    ${ref(showPopoverWhenConnected)}
    @pointerdown=${onPointerDown}
  >
    ${menu.items.map((item, index) =>
      renderOption(item, index, index === menu.activeIndex),
    )}
  </div>`;
}
