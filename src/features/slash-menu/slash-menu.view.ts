import "./slash-menu.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { createPage } from "../../blocks/page/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import type { ScopedKeyHandler, ScopedKeys } from "../../ui/shortcuts/index.ts";
import { createInlineDatabase } from "../database/index.ts";
import { convertBlock, replaceText, setBlockColor } from "../editor/index.ts";
import {
  selectOpenSlashMenu,
  SLASH_MENU_OVERLAY,
  type OpenSlashMenu,
  type SlashItem,
} from "./slash-menu.selectors.ts";

// A new subpage goes right below the block the menu was opened in.
function createSubpage(menu: OpenSlashMenu, context: ChooseContext): void {
  const block = context.state.workspace.blocks[menu.blockId];
  const parentId = block?.parentId ?? null;
  const parent =
    parentId === null ? undefined : context.state.workspace.blocks[parentId];
  if (parent === undefined || block === undefined) return;
  const index = parent.childIds.indexOf(block.id) + 1;
  context.dispatch(createPage.create({ parentId: parent.id, index }));
}

interface ChooseContext {
  readonly state: AppState;
  readonly dispatch: Dispatch;
}

// Removes the "/query" text and does what the chosen item says: turns the
// block into a type, colors it, or adds a subpage below it.
function choose(
  menu: OpenSlashMenu,
  item: SlashItem,
  context: ChooseContext,
): void {
  const { dispatch } = context;
  const { blockId, start, end } = menu;
  dispatch(closeOverlay.create({}));
  dispatch(replaceText.create({ blockId, start, end, text: "" }));
  if ("createsPage" in item) {
    createSubpage(menu, context);
  } else if ("createsDatabase" in item) {
    dispatch(createInlineDatabase.create({ blockId }));
  } else if ("color" in item) {
    dispatch(setBlockColor.create({ blockIds: [blockId], color: item.color }));
  } else {
    const { blockType, extraProps } = item;
    const extra = extraProps && { extraProps };
    dispatch(convertBlock.create({ blockId, blockType, ...extra }));
  }
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
  action: (menu: OpenSlashMenu, context: ChooseContext) => void,
): ScopedKeyHandler {
  return ({ state, dispatch }) => {
    const menu = selectOpenSlashMenu(state);
    if (menu !== undefined) action(menu, { state, dispatch });
  };
}

// Focus stays in the text while the menu is open, so its keys are caught
// on the way down to the editor, by the scoped keys owner.
export const slashMenuKeys: ScopedKeys = {
  isActive: (state) => selectOpenSlashMenu(state) !== undefined,
  keys: {
    ArrowDown: onMenu((menu, { dispatch }) => {
      highlight(menu, 1, dispatch);
    }),
    ArrowUp: onMenu((menu, { dispatch }) => {
      highlight(menu, -1, dispatch);
    }),
    Enter: onMenu((menu, context) => {
      const item = menu.items[menu.activeIndex];
      if (item !== undefined) choose(menu, item, context);
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
    <span class="slash-menu__icon">${renderIcon(item.icon)}</span>
    <span class="slash-menu__label">${item.label}</span>
    ${
      item.hint === undefined
        ? nothing
        : html`<span class="slash-menu__hint">${item.hint}</span>`
    }
  </div>`;
}

// The options, with the name of each group before its first option.
function renderOptions(menu: OpenSlashMenu): TemplateResult[] {
  return menu.items.flatMap((item, index) => {
    const option = renderOption(item, index, index === menu.activeIndex);
    if (menu.items[index - 1]?.group === item.group) return [option];
    const heading = html`<div class="slash-menu__group" role="presentation">
      ${COPY.slashMenu.groups[item.group]}
    </div>`;
    return [heading, option];
  });
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
    if (item !== undefined) choose(menu, item, { state, dispatch });
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
    ${renderOptions(menu)}
  </div>`;
}
