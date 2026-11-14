import { EQUATION_EDITOR, EQUATION_TYPE } from "../../blocks/equation/index.ts";
import { afterRender } from "../../ui/focus/index.ts";
import "./slash-menu.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  closeOverlay,
  openOverlay,
  setSelection,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { createPage } from "../../blocks/page/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import type { ScopedKeyHandler, ScopedKeys } from "../../ui/shortcuts/index.ts";
import { createInlineDatabase, createLinkedView } from "../database/index.ts";
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
    const create =
      item.createsDatabase === "inline"
        ? createInlineDatabase
        : createLinkedView;
    dispatch(create.create({ blockId }));
  } else if ("color" in item) {
    dispatch(setBlockColor.create({ blockIds: [blockId], color: item.color }));
  } else {
    const { blockType, extraProps } = item;
    const extra = extraProps && { extraProps };
    dispatch(convertBlock.create({ blockId, blockType, ...extra }));
    followUp(blockType, blockId, dispatch);
  }
}

// Blocks that take an address go on to it.
const ADDRESSED = new Set([
  "image",
  "video",
  "audio",
  "file",
  "pdf",
  "embed",
  "bookmark",
]);

// What a new block asks for next, as Notion's: a block equation opens its
// TeX editor, a block that takes an address puts the caret in its field.
function followUp(blockType: string, blockId: string, dispatch: Dispatch) {
  if (blockType === EQUATION_TYPE) {
    const overlay = { kind: EQUATION_EDITOR, anchorId: blockId };
    dispatch(openOverlay.create({ overlay }));
  } else if (ADDRESSED.has(blockType)) {
    // The caret leaves the text, so the field keeps the focus.
    dispatch(setSelection.create({ selection: null }));
    afterRender(() => {
      document
        .querySelector<HTMLInputElement>(
          `[data-block-id="${CSS.escape(blockId)}"] input`,
        )
        ?.focus();
    });
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

// "Close menu" and its key under the list, as Notion's; a press on it
// closes the menu.
function renderFooter(): TemplateResult {
  return html`<button type="button" class="slash-menu__footer" tabindex="-1">
    <span class="slash-menu__label">${COPY.slashMenu.close}</span>
    <span class="slash-menu__hint">${COPY.slashMenu.closeKey}</span>
  </button>`;
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
    if (event.target.closest(".slash-menu__footer")) {
      dispatch(closeOverlay.create({}));
      return;
    }
    const index =
      event.target.closest<HTMLElement>("[data-index]")?.dataset.index;
    const item = menu.items[Number(index ?? -1)];
    if (item !== undefined) choose(menu, item, { state, dispatch });
  };
  // As Notion's: the list scrolls inside the menu, over a Close menu line.
  return html`<div
    class="slash-menu"
    popover="manual"
    data-overlay
    ${ref(showPopoverWhenConnected)}
    @pointerdown=${onPointerDown}
  >
    <div
      class="slash-menu__list"
      role="listbox"
      tabindex="0"
      aria-label=${COPY.slashMenu.label}
    >
      ${renderOptions(menu)}
    </div>
    ${renderFooter()}
  </div>`;
}
