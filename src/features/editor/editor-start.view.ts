// The start of an empty page: a choice of layouts that turn the page into
// a database, under the line that invites writing.
import "./editor-start.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  DATABASE_TYPE,
  PAGE_TYPE,
  selectPage,
} from "../../blocks/page/index.ts";
import { VIEW_TYPES, type BlockId, type ViewType } from "../../model/index.ts";
import type { AppState, Dispatch } from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { startDatabase } from "../database/index.ts";

// The layouts in Notion's order.
const LAYOUTS = VIEW_TYPES;

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

export function renderStartList(
  pageId: BlockId,
  context: StartContext,
): TemplateResult | typeof nothing {
  if (!canStart(context.state, pageId)) return nothing;
  const start = (viewType: ViewType) => () =>
    context.dispatch(startDatabase.create({ pageId, viewType }));
  return html`<section class="editor__start" aria-labelledby="editor-start">
    <p class="editor__start-label" id="editor-start">
      ${COPY.database.startWith}
    </p>
    <div class="editor__start-options">
      ${LAYOUTS.map((viewType) =>
        renderButton({
          label: COPY.database.layouts[viewType],
          icon: "database",
          variant: "quiet",
          onClick: start(viewType),
        }),
      )}
    </div>
  </section>`;
}
