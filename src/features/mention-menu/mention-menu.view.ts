// The menu that "@", "[[" and "+" open: pages and dates to mention, and
// after "+", a new subpage or a page to link to. Focus stays
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
import { renderIcon } from "../../ui/icon/index.ts";
import { MOVE_TO_OVERLAY_KIND, NEW_PAGE_PURPOSE } from "../page-menu/index.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import type { ScopedKeyHandler, ScopedKeys } from "../../ui/shortcuts/index.ts";
import {
  createSubpageAt,
  insertMentionAt,
  linkPageAt,
} from "../editor/index.ts";
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
  const typed = { blockId, start, end };
  dispatch(closeOverlay.create({}));
  const { action } = item;
  if (action?.kind === "page-in") {
    // Where the page goes is chosen in the Move to popover.
    const values = {
      purpose: [NEW_PAGE_PURPOSE],
      title: [action.title],
      range: [String(start), String(end)],
    };
    const overlay = { kind: MOVE_TO_OVERLAY_KIND, anchorId: blockId, values };
    dispatch(openOverlay.create({ overlay }));
  } else if (action?.kind === "subpage") {
    dispatch(createSubpageAt.create({ ...typed, title: action.title }));
  } else if (action?.kind === "link") {
    dispatch(linkPageAt.create({ ...typed, pageId: action.pageId }));
  } else {
    dispatch(insertMentionAt.create({ ...typed, span: item.span }));
  }
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

const ICONS = {
  subpage: "plus",
  "page-in": "arrow-up-right",
  link: "page",
} as const;

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
    ${
      item.action === undefined
        ? nothing
        : html`<span class="mention-menu__icon" aria-hidden="true"
            >${renderIcon(ICONS[item.action.kind])}</span
          >`
    }
    <span class="mention-menu__label">${item.label}</span>
    ${
      isDate
        ? html`<span class="mention-menu__detail">${item.span.text}</span>`
        : nothing
    }
  </div>`;
}

// The heading of a section, before its first item.
function sectionBefore(menu: OpenMentionMenu, index: number) {
  const section = menu.items[index]?.section;
  if (section === undefined || menu.items[index - 1]?.section === section) {
    return nothing;
  }
  const rule = index === 0 ? nothing : html`<hr class="mention-menu__rule" />`;
  return html`${rule}
    <div class="mention-menu__section" role="presentation">${section}</div>`;
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
    ${menu.items.map(
      (item, index) =>
        html`${sectionBefore(menu, index)}${renderOption(
          item,
          index,
          index === menu.activeIndex,
        )}`,
    )}
  </div>`;
}
