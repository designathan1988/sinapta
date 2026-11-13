import "./command-palette.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderDialog } from "../../ui/dialog/index.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import {
  renderOption,
  renderPreview,
  sectionLabel,
} from "./command-palette-item.view.ts";
import {
  PALETTE_OVERLAY,
  selectPaletteItems,
  type PaletteItem,
} from "./command-palette.selectors.ts";
import { renderSearchFilters } from "./search-filters.view.ts";

interface Palette {
  readonly query: string;
  readonly items: readonly PaletteItem[];
  readonly activeIndex: number;
}

// Typing or moving through the list closes any open filter list.
function update(
  dispatch: Dispatch,
  palette: Pick<Palette, "query" | "activeIndex">,
): void {
  const overlay = {
    kind: PALETTE_OVERLAY,
    query: palette.query,
    activeIndex: palette.activeIndex,
  };
  dispatch(openOverlay.create({ overlay }));
}

// Closes the palette, then does what the item stands for: a page found
// by its text opens at the block that matched.
function run(item: PaletteItem | undefined, dispatch: Dispatch): void {
  if (item === undefined) return;
  dispatch(closeOverlay.create({}));
  if (item.href === undefined) dispatch(item.command);
  else location.hash = item.href;
}

function onKeyDown(
  event: KeyboardEvent,
  palette: Palette,
  dispatch: Dispatch,
): void {
  const { items, activeIndex } = palette;
  const count = Math.max(1, items.length);
  if (event.isComposing) return;
  if (event.key === "ArrowDown")
    update(dispatch, { ...palette, activeIndex: (activeIndex + 1) % count });
  else if (event.key === "ArrowUp")
    update(dispatch, {
      ...palette,
      activeIndex: (activeIndex - 1 + count) % count,
    });
  else if (event.key === "Enter") run(items[activeIndex], dispatch);
  else return;
  event.preventDefault();
}

function renderField(palette: Palette, dispatch: Dispatch): TemplateResult {
  const onInput = (event: Event): void => {
    if (event.target instanceof HTMLInputElement)
      update(dispatch, {
        ...palette,
        query: event.target.value,
        activeIndex: 0,
      });
  };
  return html`<label class="command-palette__search">
    ${renderIcon("search")}
    <input
      class="command-palette__field"
      type="text"
      role="combobox"
      autofocus
      aria-label=${COPY.palette.fieldLabel}
      aria-expanded="true"
      aria-controls="palette-list"
      aria-activedescendant=${`palette-option-${String(palette.activeIndex)}`}
      placeholder=${COPY.palette.placeholder}
      .value=${palette.query}
      @input=${onInput}
      @keydown=${(event: KeyboardEvent) => {
        onKeyDown(event, palette, dispatch);
      }}
    />
  </label>`;
}

function renderList(palette: Palette, dispatch: Dispatch): TemplateResult {
  const { items, activeIndex } = palette;
  const onClick = (event: Event): void => {
    const target = event.target instanceof Element ? event.target : null;
    const index = target?.closest<HTMLElement>("[data-index]")?.dataset.index;
    run(items[Number(index ?? -1)], dispatch);
  };
  return html`<ul
    class="command-palette__list"
    role="listbox"
    id="palette-list"
    @click=${onClick}
  >
    ${items.map((item, index) => {
      const label = sectionLabel(items, index);
      return html`${label === undefined ? nothing : html`<li class="command-palette__section" role="presentation">${label}</li>`}
      ${renderOption(item, index, index === activeIndex)}`;
    })}
    ${items.length === 0 ? html`<li class="command-palette__empty" role="presentation">${COPY.palette.empty}</li>` : nothing}
  </ul>`;
}

function renderContent(
  state: AppState,
  palette: Palette,
  dispatch: Dispatch,
): TemplateResult {
  return html`<div class="command-palette">
    ${renderField(palette, dispatch)} ${renderSearchFilters(state, dispatch)}
    <div class="command-palette__body">
      ${renderList(palette, dispatch)}
      ${renderPreview(state, palette.items[palette.activeIndex])}
    </div>
    <p class="command-palette__footer" aria-hidden="true">
      ${COPY.palette.footer}
    </p>
  </div>`;
}

// Search for a page or run a command by name, as Notion's search.
export function renderCommandPalette(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const { overlay } = state.ui;
  const query = overlay?.query ?? "";
  const items = selectPaletteItems(state, query, {
    filters: state.ui.searchFilters,
    today: new Date().toLocaleDateString("en-CA"),
  });
  const activeIndex = Math.min(
    overlay?.activeIndex ?? 0,
    Math.max(0, items.length - 1),
  );
  return renderDialog({
    title: COPY.palette.title,
    closeLabel: COPY.palette.close,
    variant: "search",
    content: renderContent(state, { query, items, activeIndex }, dispatch),
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
