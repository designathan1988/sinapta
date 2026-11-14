// The start of an empty page, as Notion's "Get started with": Ask AI,
// Transcribe, Database, Form and Templates as pills, and "…" for the
// other layouts a page can turn into.
import "./editor-start.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  DATABASE_TYPE,
  PAGE_TYPE,
  selectPage,
} from "../../blocks/page/index.ts";
import {
  parseBlockId,
  VIEW_TYPES,
  type BlockId,
  type ViewType,
} from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon, type IconName } from "../../ui/icon/index.ts";
import { renderMenu } from "../../ui/menu/index.ts";
import { LAYOUT_ICONS, startDatabase } from "../database/index.ts";
import { TEMPLATE_GALLERY_OVERLAY } from "../templates/index.ts";
import { startPageWith } from "./editor-start.commands.ts";

export const START_MORE_OVERLAY = "page-start-more";

// The layouts behind "…": all but the two shown as pills.
const MORE_LAYOUTS = VIEW_TYPES.filter(
  (viewType) => viewType !== "table" && viewType !== "form",
);

interface StartContext {
  readonly state: AppState;
  readonly dispatch: Dispatch;
}

// Only an empty page that is not a row of a database can start this way.
function canStart(state: AppState, pageId: BlockId): boolean {
  const page = selectPage(state, pageId);
  if (page?.type !== PAGE_TYPE || page.childIds.length > 0) return false;
  const parent =
    page.parentId === null ? undefined : state.workspace.blocks[page.parentId];
  return parent?.type !== DATABASE_TYPE;
}

function pill(label: string, icon: IconName, onClick: () => void) {
  return html`<button
    type="button"
    class="editor__start-pill"
    @click=${onClick}
  >
    ${renderIcon(icon)}<span>${label}</span>
  </button>`;
}

function renderMore(pageId: BlockId, context: StartContext): TemplateResult {
  const isOpen = context.state.ui.overlay?.kind === START_MORE_OVERLAY;
  const overlay = { kind: START_MORE_OVERLAY, anchorId: pageId };
  return html`<button
    type="button"
    class="editor__start-pill"
    aria-label=${COPY.pageStart.more}
    aria-expanded=${String(isOpen)}
    data-overlay-anchor
    @click=${() => context.dispatch(openOverlay.create({ overlay }))}
  >
    ${renderIcon("more")}
  </button>`;
}

export function renderStartList(
  pageId: BlockId,
  context: StartContext,
): TemplateResult | typeof nothing {
  if (!canStart(context.state, pageId)) return nothing;
  const { dispatch } = context;
  const start = (viewType: ViewType) => () =>
    dispatch(startDatabase.create({ pageId, viewType }));
  const begin = (kind: "ai" | "transcribe") => () =>
    dispatch(startPageWith.create({ pageId, kind }));
  const gallery = { kind: TEMPLATE_GALLERY_OVERLAY };
  const TEXT = COPY.database;
  return html`<section class="editor__start" aria-labelledby="editor-start">
    <p class="editor__start-label" id="editor-start">${TEXT.startWith}</p>
    <div class="editor__start-options">
      ${pill(COPY.pageStart.ai, "sparkles", begin("ai"))}
      ${pill(COPY.pageStart.transcribe, "file", begin("transcribe"))}
      ${pill(COPY.pageStart.database, "table", start("table"))}
      ${pill(TEXT.layouts.form, LAYOUT_ICONS.form, start("form"))}
      ${pill(COPY.pageStart.templates, "templates", () =>
        dispatch(openOverlay.create({ overlay: gallery })),
      )}
      ${renderMore(pageId, context)}
    </div>
  </section>`;
}

// "…": the other layouts, each turning the page into a database.
export function renderStartMore(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const { overlay } = state.ui;
  const pageId = parseBlockId(overlay?.anchorId ?? "");
  if (overlay?.kind !== START_MORE_OVERLAY || pageId === undefined) {
    return nothing;
  }
  return renderMenu({
    label: COPY.pageStart.more,
    items: MORE_LAYOUTS.map((viewType) => ({
      label: COPY.database.layouts[viewType],
      icon: LAYOUT_ICONS[viewType],
      onSelect: () => dispatch(startDatabase.create({ pageId, viewType })),
    })),
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
