// A column of a board: its header with the group's name, count and menu,
// its cards and the button that adds a card to it; and the list of the
// columns the view hides, each shown again by a press.
import { selectRowColor } from "../../row-color.selectors.ts";
import { DEFAULT_CARD_OPTIONS } from "../../../../model/index.ts";
import { withDefaultTemplate } from "../../template-default.commands.ts";
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
        viewId: model.view.id,
        columns: model.columns,
        dispatch,
        omit: board.property.id,
        card: model.view.card ?? DEFAULT_CARD_OPTIONS,
        color: selectRowColor(model, row, state),
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

// A column's header: its group's chip, count and menu.
export function renderColumnHeader(
  context: BoardContext,
  column: BoardColumn,
): TemplateResult {
  return html`<header class="board__header">
    ${renderChip(column.label, column.color ?? "gray")}
    <span class="board__count">${column.rows.length}</span>
    ${renderMenuButton(context, column)}
  </header>`;
}

// Adds a card with the column's value, and its lane's in a lane.
function renderNewCard(
  context: BoardContext,
  values: Readonly<Record<string, unknown>>,
): TemplateResult {
  const { model, dispatch, state } = context;
  const payload = {
    databaseId: model.database.id,
    values,
    opensPage: true,
    viewId: model.view.id,
  };
  return renderButton({
    label: COPY.database.newCard,
    icon: "plus",
    onClick: () => dispatch(addRow.create(withDefaultTemplate(state, payload))),
  });
}

// A column of cards, with its header; inside a lane, without one, its
// cards and new cards taking the lane's value too.
export function renderColumn(
  context: BoardContext,
  column: BoardColumn,
  lane?: BoardLaneValues,
): TemplateResult {
  const { board } = context;
  const value = board.valueFor?.(column.key);
  const values = {
    ...lane?.values,
    ...(value !== undefined && { [board.property.id]: value }),
  };
  return html`<section
    class="board__column"
    data-group-key=${column.key}
    data-color=${column.color ?? "gray"}
    aria-label=${column.label}
  >
    ${lane === undefined ? renderColumnHeader(context, column) : nothing}
    ${renderCards(context, column)} ${renderNewCard(context, values)}
  </section>`;
}

// What a lane gives the cards added in it.
export interface BoardLaneValues {
  readonly values: Readonly<Record<string, unknown>>;
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
    <h2 class="board__hidden-title">${COPY.database.hiddenGroups}</h2>
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
