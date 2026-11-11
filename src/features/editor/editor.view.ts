import "./editor.css";
import "./editor-page-header.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { keyed } from "lit-html/directives/keyed.js";
import { ref } from "lit-html/directives/ref.js";
import {
  DATABASE_TYPE,
  PAGE_TYPE,
  renamePage,
  selectPage,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { AppState, Dispatch } from "../../state/index.ts";
import { COPY, PRODUCT_NAME } from "../../ui/copy.ts";
import { whenConnected } from "../../ui/focus/index.ts";
import { renderDatabase, renderRowProperties } from "../database/index.ts";
import { continueWriting, renderBlocks } from "./editor-blocks.view.ts";
import { renderBlockMenu } from "./editor-block-menu.view.ts";
import { LINK_OVERLAY, renderLinkField } from "./editor-link.view.ts";
import type { InputContext } from "./editor-input.view.ts";
import { renderAddCover, renderCover } from "./editor-cover.view.ts";
import { renderIconControl } from "./editor-icon.view.ts";

// A page that opens without a title, such as one just created, takes the
// caret in its title, so typing names it. The page element is keyed by page
// id, so this runs once per opened page, not on every render.
function focusUntitled(element: Element | undefined): void {
  if (!(element instanceof HTMLInputElement)) return;
  whenConnected(element, () => {
    if (element.value === "") element.focus();
  });
}

function renderTitle(page: PageBlock, context: InputContext): TemplateResult {
  const { dispatch } = context;
  const onInput = (event: Event): void => {
    if (event.target instanceof HTMLInputElement) {
      dispatch(
        renamePage.create({ pageId: page.id, title: event.target.value }),
      );
    }
  };
  // Enter in the title moves on to the page's text.
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    continueWriting(page.id, context);
  };
  return html`<h1 class="editor__heading">
    <input
      class="editor__title"
      type="text"
      aria-label=${COPY.editor.titleLabel}
      placeholder=${COPY.sidebar.untitled}
      .value=${selectPageTitle(page)}
      @input=${onInput}
      @keydown=${onKeyDown}
      ${ref(focusUntitled)}
    />
  </h1>`;
}

// The open page: its icon, its title and its blocks.
export function renderEditor(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const page = selectPage(state, state.ui.activePageId);
  if (page === undefined || page.props.isTrashed) {
    return html`<h1 class="visually-hidden">${PRODUCT_NAME}</h1>
      <p class="editor__empty">${COPY.editor.noPage}</p>`;
  }
  const context = { state, dispatch };
  const isPage = page.type === PAGE_TYPE;
  // A row of a database shows its property values above its text.
  const content =
    page.type === DATABASE_TYPE
      ? renderDatabase(state, dispatch)
      : [renderRowProperties(state, dispatch), renderBlocks(page.id, context)];
  // Each page gets its own element, so opening a page plays the entry
  // motion and nothing of the page before it is carried over.
  return html`${keyed(
    page.id,
    html`<article
      class="editor"
      ?data-wide=${page.type === DATABASE_TYPE}
      ?data-full-width=${page.props.isFullWidth === true}
      data-font=${page.props.font ?? "default"}
      ?data-small-text=${page.props.isSmallText === true}
    >
      ${isPage ? renderCover(state, page, dispatch) : nothing}
      <div
        class="editor__page-actions"
        ?data-has-icon=${page.props.icon !== null}
      >
        ${renderIconControl(state, page, dispatch)}
        ${isPage ? renderAddCover(page, dispatch) : nothing}
      </div>
      ${renderTitle(page, context)} ${content}
    </article>`,
  )}`;
}

// The editor's own overlays: the block menus and the link field.
export function renderEditorOverlay(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  if (state.ui.overlay?.kind === LINK_OVERLAY) {
    return renderLinkField(state, dispatch);
  }
  return renderBlockMenu(state, dispatch);
}
