import { html, type TemplateResult } from "lit-html";
import {
  renamePage,
  selectPage,
  selectPageTitle,
} from "../../blocks/page/index.ts";
import type { AppState, Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";

// The open page: its title now, its blocks from milestone 3.
export function renderEditor(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const page = selectPage(state, state.ui.activePageId);
  if (page === undefined || page.props.isTrashed) {
    return html`<p class="editor__empty">${COPY.editor.noPage}</p>`;
  }
  const onInput = (event: Event): void => {
    if (event.target instanceof HTMLInputElement) {
      dispatch(
        renamePage.create({ pageId: page.id, title: event.target.value }),
      );
    }
  };
  return html`<article class="editor">
    <input
      class="editor__title"
      type="text"
      aria-label=${COPY.editor.titleLabel}
      placeholder=${COPY.sidebar.untitled}
      .value=${selectPageTitle(page)}
      @input=${onInput}
    />
  </article>`;
}
