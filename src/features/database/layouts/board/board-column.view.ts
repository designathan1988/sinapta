// A column of a board: its header with the group's name, count and menu,
// its cards and the button that adds a card to it; and the list of the
// columns the view hides, each shown again by a press.
import { renderChip } from "../../../../ui/chip/index.ts";
import { html, nothing, type TemplateResult } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { closeOverlay, openOverlay } from "../../../../state/index.ts";
import { renderButton } from "../../../../ui/button/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { renderIcon } from "../../../../ui/icon/index.ts";
import { selectCellContext } from "../../cell-context.selectors.ts";
import { toggleGroupHidden } from "../../group.commands.ts";
import { addRow } from "../../row.commands.ts";
import type { TableRow } from "../../table-model.selectors.ts";
import { renderRowCard, selectCardPicture } from "../row-card/index.ts";
import { onCardKey, type BoardContext } from "./board-cards.view.ts";
import {
  BOARD_COLUMN_OVERLAY,
  boardColumnAnchor,
} from "./board-column-menu.view.ts";
import type { BoardColumn } from "./board.selectors.ts";

// A long column shows its first cards; the count says how many there are.
const CARD_LIMIT = 100;

function renderCards(
  context: BoardContext,
  column: BoardColumn,
): TemplateResult {
  const { model, dispatch, board, state } = context;
  const shown = column.rows.slice(0, CARD_LIMIT);
  const hidden = column.rows.length - shown.length;
  const card = (row: TableRow): TemplateResult =>
    html`<li>
      ${renderRowCard({
        row,
        columns: model.columns,
        dispatch,
        omit: board.property.id,
        cell: selectCellContext(state),
        picture: selectCardPicture(state, row.id, model.view.cardPreview),
        description: COPY.database.moveCardHint,
        onKeyDown: (event) => {
          onCardKey(event, context, row.id);
        },
      })}
    </li>`;
  return html`<ul class="board__cards">
      ${repeat(shown, (row) => row.id, card)}
    </ul>
    ${
      hidden > 0
        ? html`<p class="board__more">+${hidden} ${COPY.database.moreCards}</p>`
        : nothing
    }`;
}

function renderMenuButton(
  context: BoardContext,
  column: BoardColumn,
): TemplateResult {
  const { state, dispatch, model } = context;
  const anchorId = boardColumnAnchor(model.holderId, column.key);
  const { overlay } = state.ui;
  const isOpen =
    overlay?.kind === BOARD_COLUMN_OVERLAY && overlay.anchorId === anchorId;
  const toggle = (): void => {
    const next = { kind: BOARD_COLUMN_OVERLAY, anchorId };
    dispatch(
      isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay: next }),
    );
  };
  return html`<button
    type="button"
    class="board__menu"
    data-overlay-anchor
    aria-haspopup="menu"
    aria-expanded=${String(isOpen)}
    aria-label=${`${COPY.database.columnActions}: ${column.label}`}
    @click=${toggle}
  >
    ${renderIcon("more")}
  </button>`;
}

export function renderColumn(
  context: BoardContext,
  column: BoardColumn,
): TemplateResult {
  const { model, dispatch, board } = context;
  const value = board.valueFor?.(column.key);
  const values = value === undefined ? {} : { [board.property.id]: value };
  const databaseId = model.database.id;
  const color = column.color ?? "gray";
  return html`<section
    class="board__column"
    data-group-key=${column.key}
    data-color=${color}
    aria-label=${column.label}
  >
    <header class="board__header">
      ${renderChip(column.label, color)}
      <span class="board__count">${column.rows.length}</span>
      ${renderMenuButton(context, column)}
    </header>
    ${renderCards(context, column)}
    ${renderButton({
      label: COPY.database.newCard,
      icon: "plus",
      onClick: () =>
        dispatch(addRow.create({ databaseId, values, opensPage: true })),
    })}
  </section>`;
}

export function renderHiddenColumns(
  context: BoardContext,
): TemplateResult | typeof nothing {
  const hidden = context.board.columns.filter((column) => column.isHidden);
  if (hidden.length === 0) return nothing;
  const viewId = context.model.view.id;
  const show = (key: string) => (): void => {
    context.dispatch(toggleGroupHidden.create({ viewId, key }));
  };
  return html`<section
    class="board__hidden"
    aria-label=${COPY.database.hiddenGroups}
  >
    <h3 class="board__hidden-title">${COPY.database.hiddenGroups}</h3>
    <ul class="board__hidden-list">
      ${hidden.map(
        (column) =>
          html`<li>
            <button
              type="button"
              class="board__hidden-group"
              title=${COPY.database.showGroup}
              @click=${show(column.key)}
            >
              ${renderChip(column.label, column.color ?? "gray")}
              <span class="board__count">${column.rows.length}</span>
            </button>
          </li>`,
      )}
    </ul>
  </section>`;
}
