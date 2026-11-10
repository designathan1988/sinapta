import "./trash.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  deletePage,
  restorePage,
  selectPageTitle,
  selectTrashedPages,
  type PageBlock,
} from "../../blocks/page/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderDialog } from "../../ui/dialog/index.ts";

export const TRASH_OVERLAY = "trash";

// While a page awaits confirmation, its id is the overlay's anchor id.
function renderConfirmation(
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult {
  return html`<div class="trash__confirm" role="alert">
    <strong>${COPY.trash.confirmTitle}</strong>
    <p>${COPY.trash.confirmBody}</p>
    <div class="trash__actions">
      ${renderButton({
        label: COPY.trash.cancel,
        onClick: () =>
          dispatch(openOverlay.create({ overlay: { kind: TRASH_OVERLAY } })),
      })}
      ${renderButton({
        label: COPY.trash.delete,
        variant: "danger",
        onClick() {
          dispatch(deletePage.create({ pageId: page.id }));
          dispatch(openOverlay.create({ overlay: { kind: TRASH_OVERLAY } }));
        },
      })}
    </div>
  </div>`;
}

function renderRow(page: PageBlock, dispatch: Dispatch): TemplateResult {
  const title = selectPageTitle(page);
  const overlay = { kind: TRASH_OVERLAY, anchorId: page.id };
  return html`<li class="trash__row">
    <span class="trash__title"
      >${page.props.icon ?? ""}
      ${title === "" ? COPY.sidebar.untitled : title}</span
    >
    ${renderButton({
      label: COPY.trash.restore,
      icon: "restore",
      onClick: () => dispatch(restorePage.create({ pageId: page.id })),
    })}
    ${renderButton({
      label: COPY.trash.delete,
      icon: "trash",
      variant: "danger",
      onClick: () => dispatch(openOverlay.create({ overlay })),
    })}
  </li>`;
}

function renderContent(state: AppState, dispatch: Dispatch): TemplateResult {
  const pages = selectTrashedPages(state);
  if (pages.length === 0) {
    return html`<p class="trash__empty">${COPY.trash.empty}</p>`;
  }
  const pendingId = state.ui.overlay?.anchorId;
  const pending = pages.find((page) => page.id === pendingId);
  return html`${pending === undefined ? nothing : renderConfirmation(pending, dispatch)}
    <ul class="trash__list">
      ${pages.map((page) => renderRow(page, dispatch))}
    </ul>`;
}

export function renderTrash(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  return renderDialog({
    title: COPY.trash.title,
    closeLabel: COPY.trash.close,
    content: renderContent(state, dispatch),
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
