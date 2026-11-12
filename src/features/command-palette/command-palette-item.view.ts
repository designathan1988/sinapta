// The rows of the search, as Notion's: a page's icon, its title and the
// pages it is in, and for a page found by its text the words around the
// match, marked; and beside them, the page the active row is about.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { selectPagePreview } from "./command-palette-preview.selectors.ts";
import type { PaletteItem } from "./command-palette.selectors.ts";

function keepInView(option: Element | undefined, isActive: boolean): void {
  if (isActive) option?.scrollIntoView({ block: "nearest" });
}

function renderDetail(item: PaletteItem): TemplateResult | typeof nothing {
  const { detail, match } = item;
  if (detail === undefined) return nothing;
  if (match === undefined) {
    return html`<span class="command-palette__detail">${detail}</span>`;
  }
  const end = match.start + match.length;
  return html`<span class="command-palette__detail"
    >${detail.slice(0, match.start)}<mark>${detail.slice(match.start, end)}</mark>${detail.slice(end)}</span
  >`;
}

function renderLead(item: PaletteItem): TemplateResult {
  if (item.kind === "action") return renderIcon(item.glyph ?? "chevron");
  return item.icon === null || item.icon === undefined
    ? renderIcon("page")
    : html`<span class="command-palette__emoji">${item.icon}</span>`;
}

export function renderOption(
  item: PaletteItem,
  index: number,
  isActive: boolean,
): TemplateResult {
  const hasPath = item.path !== undefined && item.path !== "";
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
    ${renderLead(item)}
    <span class="command-palette__text">
      <span class="command-palette__line">
        <span class="command-palette__label">${item.label}</span>
        ${hasPath ? html`<span class="command-palette__path">— ${item.path}</span>` : nothing}
      </span>
      ${renderDetail(item)}
    </span>
    ${isActive ? html`<kbd class="command-palette__enter" aria-hidden="true">↵</kbd>` : nothing}
  </li>`;
}

// The sections' names, before each section's first row.
export function sectionLabel(
  items: readonly PaletteItem[],
  index: number,
): string | undefined {
  const item = items[index];
  if (item === undefined || items[index - 1]?.section === item.section) {
    return undefined;
  }
  return COPY.palette.sections[item.section];
}

// The page the active row is about, as Notion shows it beside the list.
export function renderPreview(
  state: AppState,
  item: PaletteItem | undefined,
): TemplateResult {
  const preview =
    item?.pageId === undefined
      ? undefined
      : selectPagePreview(state, item.pageId);
  if (preview === undefined) {
    return html`<aside
      class="command-palette__preview"
      aria-hidden="true"
    ></aside>`;
  }
  return html`<aside
    class="command-palette__preview"
    aria-label=${COPY.palette.preview}
  >
    ${preview.path === "" ? nothing : html`<p class="command-palette__preview-path">${preview.path}</p>`}
    <h3 class="command-palette__preview-title">
      ${preview.icon === null ? nothing : html`<span>${preview.icon}</span>`}
      ${preview.title}
    </h3>
    ${preview.lines.map((line) => html`<p class="command-palette__preview-line">${line}</p>`)}
  </aside>`;
}
