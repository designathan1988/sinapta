// "In page", as Notion's: the chosen pages as tokens, a search, and the
// other pages to add; Backspace in the empty search takes the last away.
import { html, type TemplateResult } from "lit-html";
import { selectPage } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import { closeChildOverlay, setOverlayQuery } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderMenu, type MenuItem } from "../../ui/menu/index.ts";
import { titleOf } from "./command-palette-preview.selectors.ts";
import { changeFilters, type FilterContext } from "./search-filter-context.ts";
import { selectPageChoices } from "./search-filters.selectors.ts";

const TEXT = COPY.palette;

// The chosen pages, as tokens with a remove button, over the list.
function renderTokens(context: FilterContext): TemplateResult {
  const remove = (id: BlockId): void => {
    changeFilters(context, {
      inPageIds: context.filters.inPageIds.filter((item) => item !== id),
    });
  };
  const tokens = context.filters.inPageIds.flatMap((id) => {
    const page = selectPage(context.state, id);
    if (page === undefined) return [];
    const name = titleOf(page);
    return [
      html`<span class="command-palette__token">
        <span>${name}</span>
        <button
          type="button"
          aria-label=${TEXT.removePage(name)}
          @click=${() => {
            remove(id);
          }}
        >
          ${renderIcon("close")}
        </button>
      </span>`,
    ];
  });
  return html`<div class="command-palette__tokens">${tokens}</div>`;
}

// The pages not chosen yet: choosing one adds it and keeps the list open.
function pageItems(context: FilterContext): MenuItem[] {
  const { inPageIds } = context.filters;
  return selectPageChoices(context.state, inPageIds).map((page) => ({
    label: page.title,
    icon: "page",
    ...(page.path !== "" && { description: page.path }),
    keepsOpen: true,
    onSelect: () => {
      changeFilters(context, { inPageIds: [...inPageIds, page.id] });
    },
  }));
}

// Backspace in the empty search takes the last chosen page away.
export function onInPageKey(
  event: KeyboardEvent,
  context: FilterContext,
): void {
  const field = event.target;
  const ids = context.filters.inPageIds;
  if (event.key !== "Backspace" || ids.length === 0) return;
  if (!(field instanceof HTMLInputElement) || field.value !== "") return;
  changeFilters(context, { inPageIds: ids.slice(0, -1) });
}

// The list follows its chip, which the browser anchors it to.
export function renderInPageList(context: FilterContext): TemplateResult {
  const query = context.state.ui.overlay?.children?.[0]?.query ?? "";
  return renderMenu({
    label: TEXT.inPage,
    role: "listbox",
    isChild: true,
    lead: renderTokens(context),
    search: {
      placeholder: TEXT.searchPages,
      query,
      onQuery: (next) =>
        context.dispatch(setOverlayQuery.create({ query: next })),
    },
    items: pageItems(context),
    onClose: () => context.dispatch(closeChildOverlay.create({ depth: 0 })),
  });
}
