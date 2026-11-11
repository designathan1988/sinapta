import "./command-palette.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderDialog } from "../../ui/dialog/index.ts";
import {
  PALETTE_OVERLAY,
  selectPaletteItems,
  type PaletteItem,
} from "./command-palette.selectors.ts";

interface Palette {
  readonly query: string;
  readonly items: readonly PaletteItem[];
  readonly activeIndex: number;
}

function update(dispatch: Dispatch, query: string, activeIndex: number): void {
  const overlay = { kind: PALETTE_OVERLAY, query, activeIndex };
  dispatch(openOverlay.create({ overlay }));
}

// Closes the palette, then does what the item stands for.
function run(item: PaletteItem | undefined, dispatch: Dispatch): void {
  if (item === undefined) return;
  dispatch(closeOverlay.create({}));
  dispatch(item.command);
}

function onKeyDown(
  event: KeyboardEvent,
  palette: Palette,
  dispatch: Dispatch,
): void {
  const { query, items, activeIndex } = palette;
  const count = Math.max(1, items.length);
  if (event.isComposing) return;
  if (event.key === "ArrowDown")
    update(dispatch, query, (activeIndex + 1) % count);
  else if (event.key === "ArrowUp")
    update(dispatch, query, (activeIndex - 1 + count) % count);
  else if (event.key === "Enter") run(items[activeIndex], dispatch);
  else return;
  event.preventDefault();
}

function keepInView(option: Element | undefined, isActive: boolean): void {
  if (isActive) option?.scrollIntoView({ block: "nearest" });
}

function renderOption(
  item: PaletteItem,
  index: number,
  isActive: boolean,
): TemplateResult {
  return html`<li
    class="command-palette__item"
    role="option"
    id=${`palette-option-${String(index)}`}
    data-index=${index}
    data-kind=${item.kind}
    aria-selected=${String(isActive)}
    ${ref((option) => {
      keepInView(option, isActive);
    })}
  >
    <span class="command-palette__label">${item.label}</span>
    ${
      item.detail === undefined
        ? nothing
        : html`<span class="command-palette__detail">${item.detail}</span>`
    }
  </li>`;
}

function renderContent(palette: Palette, dispatch: Dispatch): TemplateResult {
  const { query, items, activeIndex } = palette;
  const onInput = (event: Event): void => {
    if (event.target instanceof HTMLInputElement)
      update(dispatch, event.target.value, 0);
  };
  const onClick = (event: Event): void => {
    const target = event.target instanceof Element ? event.target : null;
    const index = target?.closest<HTMLElement>("[data-index]")?.dataset.index;
    run(items[Number(index ?? -1)], dispatch);
  };
  return html`<input
      class="command-palette__field"
      type="text"
      role="combobox"
      autofocus
      aria-label=${COPY.palette.fieldLabel}
      aria-expanded="true"
      aria-controls="palette-list"
      aria-activedescendant=${`palette-option-${String(activeIndex)}`}
      placeholder=${COPY.palette.placeholder}
      .value=${query}
      @input=${onInput}
      @keydown=${(event: KeyboardEvent) => {
        onKeyDown(event, palette, dispatch);
      }}
    />
    <ul
      class="command-palette__list"
      role="listbox"
      id="palette-list"
      @click=${onClick}
    >
      ${items.map((item, index) => renderOption(item, index, index === activeIndex))}
    </ul>
    <p class="command-palette__empty" role="status">
      ${items.length === 0 ? COPY.palette.empty : ""}
    </p>`;
}

// Search for a page or run a command by name.
export function renderCommandPalette(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const query = state.ui.overlay?.query ?? "";
  const items = selectPaletteItems(state, query);
  const activeIndex = Math.min(
    state.ui.overlay?.activeIndex ?? 0,
    Math.max(0, items.length - 1),
  );
  return renderDialog({
    title: COPY.palette.title,
    closeLabel: COPY.palette.close,
    content: renderContent({ query, items, activeIndex }, dispatch),
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
