import "./trash.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  deletePage,
  restorePage,
  type PageBlock,
} from "../../blocks/page/index.ts";
import { parseBlockId } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderDialog } from "../../ui/dialog/index.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderSelect } from "../../ui/select/index.ts";
import {
  selectTrashParents,
  selectTrashRows,
  type TrashFilter,
  type TrashRow,
} from "./trash.selectors.ts";

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

// The trash's search and "In" filter, kept in the open overlay.
const IN_FLAG = "in:";

function filterOf(state: AppState): TrashFilter {
  const { overlay } = state.ui;
  const flag = overlay?.flags?.find((item) => item.startsWith(IN_FLAG));
  const inId =
    flag === undefined ? undefined : parseBlockId(flag.slice(IN_FLAG.length));
  return { query: overlay?.query ?? "", inId: inId ?? null };
}

function setFilter(dispatch: Dispatch, filter: TrashFilter): void {
  const flags = filter.inId === null ? [] : [`${IN_FLAG}${filter.inId}`];
  const overlay = { kind: TRASH_OVERLAY, query: filter.query, flags };
  dispatch(openOverlay.create({ overlay }));
}

// "In": the page the listed pages were in, or any.
function renderInFilter(state: AppState, dispatch: Dispatch): TemplateResult {
  const filter = filterOf(state);
  const parents = selectTrashParents(state);
  const anywhere = "";
  const options = [
    { value: anywhere, label: COPY.trash.anywhere },
    ...parents.map((parent) => ({
      value: parent.id,
      label: parent.title,
      icon: "page" as const,
    })),
  ];
  return renderSelect(
    {
      id: "trash-in",
      label: COPY.trash.in,
      value: filter.inId ?? anywhere,
      variant: "quiet",
      options,
      onChoose: (value) => {
        const inId = parents.find((parent) => parent.id === value)?.id;
        setFilter(dispatch, { ...filter, inId: inId ?? null });
      },
    },
    { overlay: state.ui.overlay, dispatch },
  );
}

function renderTools(state: AppState, dispatch: Dispatch): TemplateResult {
  const filter = filterOf(state);
  const onInput = (event: Event): void => {
    if (event.target instanceof HTMLInputElement)
      setFilter(dispatch, { ...filter, query: event.target.value });
  };
  // Escape closes the trash, as Notion's, instead of only clearing the
  // words the way a search field does by itself.
  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    dispatch(closeOverlay.create({}));
  };
  return html`<div class="trash__tools">
    <input
      class="trash__search"
      type="search"
      autofocus
      aria-label=${COPY.trash.search}
      placeholder=${COPY.trash.search}
      .value=${filter.query}
      @input=${onInput}
      @keydown=${onKeydown}
    />
    ${renderInFilter(state, dispatch)}
  </div>`;
}

function renderRow(row: TrashRow, dispatch: Dispatch): TemplateResult {
  const { page } = row;
  const overlay = { kind: TRASH_OVERLAY, anchorId: page.id };
  return html`<li class="trash__row">
    <span class="trash__icon" aria-hidden="true"
      >${page.props.icon ?? renderIcon("page")}</span
    >
    <span class="trash__text">
      <span class="trash__title">${row.title}</span>
      ${row.path === "" ? nothing : html`<span class="trash__path">${row.path}</span>`}
    </span>
    ${renderButton({
      label: COPY.trash.restore,
      icon: "restore",
      isIconOnly: true,
      onClick: () => dispatch(restorePage.create({ pageId: page.id })),
    })}
    ${renderButton({
      label: COPY.trash.delete,
      icon: "trash",
      isIconOnly: true,
      onClick: () => dispatch(openOverlay.create({ overlay })),
    })}
  </li>`;
}

function renderContent(state: AppState, dispatch: Dispatch): TemplateResult {
  const rows = selectTrashRows(state, filterOf(state));
  const pendingId = state.ui.overlay?.anchorId;
  const pending = rows.find((row) => row.page.id === pendingId)?.page;
  const isEmpty = selectTrashParents(state).length === 0 && rows.length === 0;
  return html`${renderTools(state, dispatch)}
    ${pending === undefined ? nothing : renderConfirmation(pending, dispatch)}
    ${
      rows.length === 0
        ? html`<p class="trash__empty">
            ${isEmpty ? COPY.trash.empty : COPY.trash.noMatches}
          </p>`
        : html`<ul class="trash__list">
            ${rows.map((row) => renderRow(row, dispatch))}
          </ul>`
    }
    <p class="trash__note">${COPY.trash.autoDelete}</p>`;
}

export function renderTrash(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  return renderDialog({
    title: COPY.trash.title,
    closeLabel: COPY.trash.close,
    variant: "panel",
    content: renderContent(state, dispatch),
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
