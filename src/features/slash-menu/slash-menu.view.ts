import "./slash-menu.css";
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
import { convertBlock, replaceText, setBlockColor } from "../editor/index.ts";
import {
  selectOpenSlashMenu,
  SLASH_MENU_OVERLAY,
  type OpenSlashMenu,
  type SlashItem,
} from "./slash-menu.selectors.ts";

// Removes the "/query" text and turns the block into the chosen item.
function choose(
  menu: OpenSlashMenu,
  item: SlashItem,
  dispatch: Dispatch,
): void {
  const { blockId, start, end } = menu;
  dispatch(closeOverlay.create({}));
  dispatch(replaceText.create({ blockId, start, end, text: "" }));
  if ("color" in item) {
    dispatch(setBlockColor.create({ blockIds: [blockId], color: item.color }));
    return;
  }
  const { blockType, extraProps } = item;
  dispatch(
    convertBlock.create({
      blockId,
      blockType,
      ...(extraProps && { extraProps }),
    }),
  );
}

function highlight(
  menu: OpenSlashMenu,
  offset: number,
  dispatch: Dispatch,
): void {
  const count = menu.items.length;
  const activeIndex = (menu.activeIndex + offset + count) % count;
  const overlay = {
    kind: SLASH_MENU_OVERLAY,
    anchorId: menu.blockId,
    start: menu.start,
    activeIndex,
  };
  dispatch(openOverlay.create({ overlay }));
  announce(menu.items[activeIndex]?.label ?? "");
}

// Runs a key's action on the open menu; the keys apply only while one is.
function onMenu(
  action: (menu: OpenSlashMenu, dispatch: Dispatch) => void,
): ScopedKeyHandler {
  return ({ state, dispatch }) => {
    const menu = selectOpenSlashMenu(state);
    if (menu !== undefined) action(menu, dispatch);
  };
}

// Focus stays in the text while the menu is open, so its keys are caught
// on the way down to the editor, by the scoped keys owner.
export const slashMenuKeys: ScopedKeys = {
  isActive: (state) => selectOpenSlashMenu(state) !== undefined,
  keys: {
    ArrowDown: onMenu((menu, dispatch) => {
      highlight(menu, 1, dispatch);
    }),
    ArrowUp: onMenu((menu, dispatch) => {
      highlight(menu, -1, dispatch);
    }),
    Enter: onMenu((menu, dispatch) => {
      const item = menu.items[menu.activeIndex];
      if (item !== undefined) choose(menu, item, dispatch);
    }),
    Escape: ({ dispatch }) => dispatch(closeOverlay.create({})),
  },
};

function keepInView(option: Element | undefined, isActive: boolean): void {
  if (isActive) option?.scrollIntoView({ block: "nearest" });
}

function renderOption(
  item: SlashItem,
  index: number,
  isActive: boolean,
): TemplateResult {
  return html`<div
    class="slash-menu__item"
    role="option"
    data-index=${index}
    aria-selected=${String(isActive)}
    ${ref((option) => {
      keepInView(option, isActive);
    })}
  >
    ${item.label}
  </div>`;
}

// The list of block types offered after "/" is typed.
export function renderSlashMenu(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const menu = selectOpenSlashMenu(state);
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
    class="slash-menu"
    role="listbox"
    tabindex="0"
    popover="manual"
    data-overlay
    aria-label=${COPY.slashMenu.label}
    ${ref(showPopoverWhenConnected)}
    @pointerdown=${onPointerDown}
  >
    ${menu.items.map((item, index) =>
      renderOption(item, index, index === menu.activeIndex),
    )}
  </div>`;
}
