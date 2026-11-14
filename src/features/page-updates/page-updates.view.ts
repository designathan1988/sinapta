// Notion's "Updates & analytics": a panel docked beside the page, opened
// from the page menu, with two tabs. Updates lists each run of edits, who
// made it and when, and the blocks it changed, five at most before "Show
// more"; its clock opens the page's version history. Analytics is beside.
import "./page-updates.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  selectPage,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import {
  openOverlay,
  PAGE_HISTORY_OVERLAY,
  showPageUpdates,
  type AppState,
  type Dispatch,
  type PageUpdatesTab,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { renderAnalytics } from "./page-updates-analytics.view.ts";
import { renderPersonMark } from "./page-updates-person.view.ts";
import {
  selectTimeAgo,
  selectUpdateEntries,
  type ChangedLine,
  type UpdateEntry,
} from "./page-updates.selectors.ts";

const TEXT = COPY.pageUpdates;
const SHOWN_LINES = 5;

function renderLines(lines: readonly ChangedLine[]): TemplateResult {
  return html`<ul class="page-updates__lines">
    ${lines.map((line) =>
      line.isTitle
        ? html`<li class="page-updates__title">
            <span class="page-updates__caption"
              >${renderIcon("title")} ${TEXT.title}</span
            >
            <span class="page-updates__title-text">${line.text}</span>
          </li>`
        : html`<li class="page-updates__line">${line.text}</li>`,
    )}
  </ul>`;
}

function renderEntry(
  view: { readonly state: AppState; readonly page: PageBlock; now: string },
  entry: UpdateEntry,
  dispatch: Dispatch,
): TemplateResult {
  const you = view.state.persistence.account.user?.name;
  const other = entry.author === you ? undefined : entry.author;
  const who = other === undefined ? TEXT.youEdited : `${other} ${TEXT.edited}`;
  const rest = entry.lines.slice(SHOWN_LINES);
  return html`<article class="page-updates__entry">
    ${renderPersonMark(other ?? you ?? TEXT.you)}
    <div class="page-updates__entry-body">
      <p class="page-updates__summary">
        ${who} <strong>${selectPageTitle(view.page)}</strong>
      </p>
      <time class="page-updates__when" datetime=${entry.at}
        >${selectTimeAgo(entry.at, view.now)}</time
      >
      ${renderLines(entry.lines.slice(0, SHOWN_LINES))}
      ${
        rest.length === 0
          ? nothing
          : html`<details class="page-updates__more">
              <summary>${TEXT.showMore(rest.length)}</summary>
              ${renderLines(rest)}
            </details>`
      }
    </div>
    ${renderHistoryButton(view.page, dispatch)}
  </article>`;
}

// The clock that opens the page's version history.
function renderHistoryButton(
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult {
  const history = { kind: PAGE_HISTORY_OVERLAY, anchorId: page.id };
  return html`<button
    type="button"
    class="page-updates__history"
    aria-label=${TEXT.openVersion}
    title=${tooltipTitle(TEXT.openVersion)}
    interestfor=${TOOLTIP_TARGET}
    @click=${() => dispatch(openOverlay.create({ overlay: history }))}
  >
    ${renderIcon("clock")}
  </button>`;
}

function renderUpdates(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult {
  const entries = selectUpdateEntries(state, page.id);
  if (entries.length === 0)
    return html`<p class="page-updates__empty">${TEXT.noUpdates}</p>`;
  const view = { state, page, now: new Date().toISOString() };
  return html`${entries.map((entry) => renderEntry(view, entry, dispatch))}`;
}

function renderTab(
  tab: PageUpdatesTab,
  open: { readonly pageId: PageBlock["id"]; readonly tab: PageUpdatesTab },
  dispatch: Dispatch,
): TemplateResult {
  const isChosen = open.tab === tab;
  return html`<button
    type="button"
    role="tab"
    class="page-updates__tab"
    aria-selected=${String(isChosen)}
    tabindex=${isChosen ? "0" : "-1"}
    @click=${() =>
      dispatch(showPageUpdates.create({ pageId: open.pageId, tab }))}
  >
    ${tab === "updates" ? TEXT.updates : TEXT.analytics}
  </button>`;
}

export function renderPageUpdatesPanel(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const open = state.ui.pageUpdates;
  const page = selectPage(state, open?.pageId ?? null);
  if (open === undefined || page === undefined) return nothing;
  return html`<aside class="page-updates" aria-label=${TEXT.panel}>
    <div class="page-updates__head">
      <button
        type="button"
        class="page-updates__close"
        aria-label=${TEXT.close}
        title=${tooltipTitle(TEXT.close)}
        interestfor=${TOOLTIP_TARGET}
        @click=${() => dispatch(showPageUpdates.create({ pageId: null }))}
      >
        ${renderIcon("peek-close")}
      </button>
    </div>
    <div class="page-updates__tabs" role="tablist">
      ${renderTab("updates", open, dispatch)}
      ${renderTab("analytics", open, dispatch)}
    </div>
    <div class="page-updates__body" role="tabpanel">
      ${
        open.tab === "updates"
          ? renderUpdates(state, page, dispatch)
          : renderAnalytics(state, page)
      }
    </div>
  </aside>`;
}
