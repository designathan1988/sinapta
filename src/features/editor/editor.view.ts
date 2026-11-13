import { openOverlay } from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import "./editor.css";
import "./editor-page-header.css";
import "./editor-handles.css";
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
import { selectDatabase } from "../../blocks/database/index.ts";
import type { BlockId } from "../../model/index.ts";
import type { AppState, Dispatch } from "../../state/index.ts";
import { COPY, PRODUCT_NAME } from "../../ui/copy.ts";
import { whenConnected } from "../../ui/focus/index.ts";
import {
  renderDatabase,
  renderRowProperties,
  renderTemplateBanner,
} from "../database/index.ts";
import { continueWriting, renderBlocks } from "./editor-blocks.view.ts";
import { renderBlockMenu } from "./editor-block-menu.view.ts";
import { INLINE_EQUATION_OVERLAY } from "./editor-equation.commands.ts";
import { renderInlineEquationEditor } from "./editor-equation.view.ts";
import {
  BLOCK_COLOR_OVERLAY,
  renderColorMenu,
} from "./editor-color-menu.view.ts";
import { LINK_OVERLAY, renderLinkField } from "./editor-link.view.ts";
import type { InputContext } from "./editor-input.view.ts";
import { renderAddCover, renderCover } from "./editor-cover.view.ts";
import { renderBacklinks } from "../backlinks/index.ts";
import {
  COMMENT_COMPOSER_OVERLAY,
  renderPageDiscussions,
  renderRowDiscussions,
} from "../comments/index.ts";
import { renderIconControl } from "./editor-icon.view.ts";
import { renderTrashedBanner } from "./editor-trashed.view.ts";

// A page that opens without a title, such as one just created, takes the
// caret in its title, so typing names it. The page element is keyed by page
// id, so this runs once per opened page, not on every render.
function focusUntitled(element: Element | undefined): void {
  if (!(element instanceof HTMLTextAreaElement)) return;
  whenConnected(element, () => {
    if (element.value === "" && !element.readOnly) element.focus();
  });
}

// A title is one line of text that wraps, as Notion's; a pasted line
// break becomes a space.
function renderTitle(page: PageBlock, context: InputContext): TemplateResult {
  const { dispatch } = context;
  const onInput = (event: Event): void => {
    if (event.target instanceof HTMLTextAreaElement) {
      const title = event.target.value.replace(/\r?\n/g, " ");
      dispatch(renamePage.create({ pageId: page.id, title }));
    }
  };
  // Enter in the title moves on to the page's text.
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    continueWriting(page.id, context);
  };
  return html`<h1 class="editor__heading">
    <textarea
      class="editor__title"
      rows="1"
      aria-label=${COPY.editor.titleLabel}
      placeholder=${COPY.sidebar.untitled}
      ?readonly=${page.props.isLocked === true || page.props.isTrashed}
      .value=${selectPageTitle(page)}
      @input=${onInput}
      @keydown=${onKeyDown}
      ${ref(focusUntitled)}
    ></textarea>
  </h1>`;
}

// A page inside a database: a row, with its properties and comments.
function isRow(state: AppState, page: PageBlock): boolean {
  return selectDatabase(state, page.parentId) !== undefined;
}

// What a page holds under its title: a database's views, or a page's
// blocks; a row's property values and its comments above them, as
// Notion's.
function renderContent(page: PageBlock, context: InputContext) {
  const { state, dispatch } = context;
  if (page.type === DATABASE_TYPE) return renderDatabase(state, dispatch);
  return [
    renderRowProperties(state, dispatch, page.id),
    isRow(state, page) ? renderRowDiscussions(state, dispatch, page) : nothing,
    renderBlocks(page.id, context),
  ];
}

// Notion's "Add comment", beside "Add icon" and "Add cover".
function renderAddComment(page: PageBlock, dispatch: Dispatch) {
  const overlay = { kind: COMMENT_COMPOSER_OVERLAY, anchorId: page.id };
  return renderButton({
    label: COPY.comments.addToPage,
    icon: "comment",
    onClick: () => dispatch(openOverlay.create({ overlay })),
  });
}

// Over the title, as Notion's: the page's icon on its own line, then one
// row of "Add icon", "Add cover" and "Add comment", as each applies.
function renderPageActions(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult {
  const isPage = page.type === PAGE_TYPE;
  const hasIcon = page.props.icon !== null;
  const icon = renderIconControl(state, page, dispatch);
  return html`${hasIcon ? html`<div class="editor__page-icon">${icon}</div>` : nothing}
    <div class="editor__page-actions">
      ${hasIcon ? nothing : icon}
      ${isPage ? renderAddCover(page, dispatch) : nothing}
      ${isPage ? renderAddComment(page, dispatch) : nothing}
    </div>`;
}

// The strips across the page's top: the trash's, and a template's on its
// own page (in a peek it sits under the peek's bar instead).
function renderBanners(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult {
  return html`${
    page.props.isTrashed ? renderTrashedBanner(page, dispatch) : nothing
  }
  ${
    state.ui.activePageId === page.id
      ? renderTemplateBanner(state, page.id, dispatch)
      : nothing
  }`;
}

// A page: its icon, its title and its blocks. The open page, unless a
// peek shows another.
export function renderEditor(
  state: AppState,
  dispatch: Dispatch,
  pageId: BlockId | null = state.ui.activePageId,
): TemplateResult {
  const page = selectPage(state, pageId);
  if (page === undefined) {
    return html`<h1 class="visually-hidden">${PRODUCT_NAME}</h1>
      <p class="editor__empty">${COPY.editor.noPage}</p>`;
  }
  const context = { state, dispatch };
  const isPage = page.type === PAGE_TYPE;
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
      ?data-locked=${page.props.isLocked === true || page.props.isTrashed}
    >
      ${renderBanners(state, page, dispatch)}
      ${isPage ? renderCover(state, page, dispatch) : nothing}
      ${renderPageActions(state, page, dispatch)} ${renderTitle(page, context)}
      ${isPage ? renderBacklinks(state, dispatch, page) : nothing}
      ${
        isPage && !isRow(state, page)
          ? renderPageDiscussions(state, dispatch, page)
          : nothing
      }
      ${renderContent(page, context)}
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
  if (state.ui.overlay?.kind === BLOCK_COLOR_OVERLAY) {
    return renderColorMenu(state, dispatch);
  }
  if (state.ui.overlay?.kind === INLINE_EQUATION_OVERLAY) {
    return renderInlineEquationEditor(state, dispatch);
  }
  return renderBlockMenu(state, dispatch);
}
