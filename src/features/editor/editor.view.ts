import { html, type TemplateResult } from "lit-html";
import {
  renamePage,
  selectPage,
  selectPageTitle,
} from "../../blocks/page/index.ts";
import type { AppState, Dispatch } from "../../state/index.ts";
import { COPY, PRODUCT_NAME } from "../../ui/copy.ts";
import { continueWriting, renderBlocks } from "./editor-blocks.view.ts";
import { renderIconControl } from "./editor-icon.view.ts";

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
  return html`<article class="editor">
    ${renderIconControl(state, page, dispatch)}
    <h1 class="editor__heading">
      <input
        class="editor__title"
        type="text"
        aria-label=${COPY.editor.titleLabel}
        placeholder=${COPY.sidebar.untitled}
        .value=${selectPageTitle(page)}
        @input=${onInput}
        @keydown=${onKeyDown}
      />
    </h1>
    ${renderBlocks(page.id, context)}
  </article>`;
}
