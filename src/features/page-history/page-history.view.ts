// A page's history, as Notion's: the version chosen shown as it was,
// read only, beside the list of versions, newest first, and the button
// that restores it.
import "./page-history.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { isTextBlock, textOf } from "../../blocks/index.ts";
import { isPageLike, selectPageTitle } from "../../blocks/page/index.ts";
import { parseBlockId, type Block, type BlockId } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  PAGE_HISTORY_OVERLAY,
  type AppState,
  type Dispatch,
  type PageVersion,
} from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderDialog } from "../../ui/dialog/index.ts";
import { restorePageVersion } from "./page-history.commands.ts";
import {
  selectVersionChanges,
  type BlockChange,
} from "./page-history.selectors.ts";

const TEXT = COPY.pageHistory;

const WHEN = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// A line's text, with the words the version wrote marked.
function renderText(
  text: string,
  change: BlockChange | undefined,
): TemplateResult | string {
  if (change === undefined) return text;
  if (change.kind === "new")
    return html`<mark class="page-history__change">${text}</mark>`;
  return html`${text.slice(0, change.start)}<mark class="page-history__change"
      >${text.slice(change.start, change.end)}</mark
    >${text.slice(change.end)}`;
}

function renderLine(
  block: Block,
  changes: ReadonlyMap<BlockId, BlockChange>,
): TemplateResult | typeof nothing {
  if (isPageLike(block)) return nothing;
  const text = isTextBlock(block) ? textOf(block) : "";
  return html`<p class="page-history__line" data-type=${block.type}>
    ${renderText(text, changes.get(block.id))}
  </p>`;
}

function renderPreview(
  version: PageVersion,
  changes: ReadonlyMap<BlockId, BlockChange>,
): TemplateResult {
  const [page, ...blocks] = version.blocks;
  const title =
    page === undefined || !isPageLike(page) ? "" : selectPageTitle(page);
  return html`<section class="page-history__preview" aria-label=${TEXT.preview}>
    <h3 class="page-history__title">
      ${title === "" ? COPY.sidebar.untitled : title}
    </h3>
    ${blocks.map((block) => renderLine(block, changes))}
  </section>`;
}

function renderVersions(
  versions: readonly PageVersion[],
  activeIndex: number,
  choose: (index: number) => void,
): TemplateResult {
  return html`<ul class="page-history__list" aria-label=${TEXT.versions}>
    ${versions.map(
      (version, index) =>
        html`<li>
          <button
            type="button"
            class="page-history__version"
            aria-pressed=${String(index === activeIndex)}
            @click=${() => {
              choose(index);
            }}
          >
            ${WHEN.format(new Date(version.takenAt))}
          </button>
        </li>`,
    )}
  </ul>`;
}

function renderBody(
  state: AppState,
  pageId: BlockId,
  dispatch: Dispatch,
): TemplateResult {
  const loaded = state.ui.pageVersions;
  if (loaded?.pageId !== pageId) {
    return html`<p class="page-history__note">${TEXT.loading}</p>`;
  }
  const { versions } = loaded;
  const activeIndex = Math.min(
    state.ui.overlay?.activeIndex ?? 0,
    versions.length - 1,
  );
  const chosen = versions[activeIndex];
  if (chosen === undefined) {
    return html`<p class="page-history__note">${TEXT.empty}</p>`;
  }
  const choose = (index: number): void => {
    const overlay = {
      kind: PAGE_HISTORY_OVERLAY,
      anchorId: pageId,
      activeIndex: index,
    };
    dispatch(openOverlay.create({ overlay }));
  };
  const restore = (): void => {
    dispatch(restorePageVersion.create({ pageId, blocks: chosen.blocks }));
    dispatch(closeOverlay.create({}));
    announce(TEXT.restored);
  };
  const changes = selectVersionChanges(versions, activeIndex);
  return html`<div class="page-history__side">
      ${renderVersions(versions, activeIndex, choose)}
      ${renderButton({ label: TEXT.restore, variant: "primary", onClick: restore })}
    </div>
    ${renderPreview(chosen, changes)}`;
}

export function renderPageHistory(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const pageId = parseBlockId(state.ui.overlay?.anchorId ?? "");
  if (pageId === undefined || state.workspace.blocks[pageId] === undefined)
    return nothing;
  return renderDialog({
    title: TEXT.title,
    closeLabel: TEXT.close,
    variant: "full",
    content: html`<div class="page-history">
      ${renderBody(state, pageId, dispatch)}
    </div>`,
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
