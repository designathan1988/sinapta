// Notion's backlinks, under a page's title: "N backlinks", which opens the
// pages that link here, each opening that page; or the list always open,
// or nothing, as the page is customized.
import "./backlinks.css";
import { html, nothing, type TemplateResult } from "lit-html";
import type { PageBlock } from "../../blocks/page/index.ts";
import {
  setActivePage,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY, pluralize } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { selectBacklinkPages, type Backlink } from "./backlinks.selectors.ts";

function renderLinks(
  links: readonly Backlink[],
  dispatch: Dispatch,
): TemplateResult {
  return html`<ul class="backlinks__list">
    ${links.map(
      (link) =>
        html`<li>
          <button
            type="button"
            class="backlinks__link"
            @click=${() =>
              dispatch(setActivePage.create({ pageId: link.pageId }))}
          >
            ${link.icon === null ? renderIcon("page") : html`<span>${link.icon}</span>`}
            <span class="backlinks__title">${link.title}</span>
          </button>
        </li>`,
    )}
  </ul>`;
}

export function renderBacklinks(
  state: AppState,
  dispatch: Dispatch,
  page: PageBlock,
): TemplateResult | typeof nothing {
  const display = page.props.backlinks ?? "popover";
  if (display === "off") return nothing;
  const links = selectBacklinkPages(state, page.id);
  if (links.length === 0) return nothing;
  const count = links.length;
  const label = `${String(count)} ${pluralize(count, COPY.backlinks.count)}`;
  if (display === "expanded") {
    return html`<section class="backlinks" aria-label=${COPY.backlinks.label}>
      <p class="backlinks__summary">${renderIcon("arrow-up-right")} ${label}</p>
      ${renderLinks(links, dispatch)}
    </section>`;
  }
  // A disclosure keeps whether it is open itself, between renders.
  return html`<details class="backlinks">
    <summary class="backlinks__summary">
      ${renderIcon("arrow-up-right")} ${label}
    </summary>
    ${renderLinks(links, dispatch)}
  </details>`;
}
