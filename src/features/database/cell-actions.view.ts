// The bar a value cell shows while pointed at, as Notion's: a button that
// comments on the value (or, once it has discussions, opens them, with
// their count) and one that copies the value; and the comment popovers it
// opens, anchored on the cell but drawn outside the grid, so that the grid
// never takes their keys or their focus.
import { html, nothing, type TemplateResult } from "lit-html";
import "./cell-actions.css";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { BlockId } from "../../model/index.ts";
import {
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import {
  renderValueComments,
  selectValueDiscussionCount,
  VALUE_COMPOSER_OVERLAY,
  VALUE_DISCUSSIONS_OVERLAY,
  valueAnchorId,
  type ValueTarget,
} from "../comments/index.ts";
import { propertyType } from "./property-registry.ts";
import type { TableContext } from "./table-cell.view.ts";
import type { TableColumn, TableRow } from "./table-model.selectors.ts";

const TEXT = COPY.database;

// A value as text, as its cell's editor and the clipboard read it.
export function valueText(
  values: Readonly<Record<string, unknown>>,
  property: PropertyDefinition,
): string {
  const type = propertyType(property.type);
  return type.format(type.read(values[property.id]), property);
}

// What a comment on a row's value is about.
export function valueTarget(
  rowId: BlockId,
  values: Readonly<Record<string, unknown>>,
  property: PropertyDefinition,
): ValueTarget {
  return {
    rowId,
    propertyId: property.id,
    propertyName: property.name,
    quote: valueText(values, property),
  };
}

function copyValue(text: string): void {
  if (typeof navigator === "undefined" || !("clipboard" in navigator)) return;
  navigator.clipboard.writeText(text).then(
    () => {
      announce(TEXT.valueCopied);
    },
    () => undefined,
  );
}

function renderBarButton(
  label: string,
  onPress: () => void,
  content: TemplateResult,
): TemplateResult {
  return html`<button
    type="button"
    class="database__cell-action"
    tabindex="-1"
    aria-label=${label}
    title=${tooltipTitle(label)}
    interestfor=${TOOLTIP_TARGET}
    @click=${onPress}
  >
    ${content}
  </button>`;
}

// The comment button: "Comment on property value", or "Open discussion"
// with the count once the value has open discussions.
function renderCommentButton(
  state: AppState,
  dispatch: Dispatch,
  target: ValueTarget,
): TemplateResult {
  const { rowId, propertyId } = target;
  const count = selectValueDiscussionCount(state, rowId, propertyId);
  const kind = count === 0 ? VALUE_COMPOSER_OVERLAY : VALUE_DISCUSSIONS_OVERLAY;
  const overlay = { kind, anchorId: valueAnchorId(rowId, propertyId) };
  const open = (): void => {
    dispatch(openOverlay.create({ overlay }));
  };
  if (count === 0)
    return renderBarButton(TEXT.commentOnValue, open, renderIcon("comment"));
  return renderBarButton(
    TEXT.openValueDiscussion,
    open,
    html`${renderIcon("comment")}<span class="database__cell-count"
        >${count}</span
      >`,
  );
}

// The bar, over the cell's start; it shows while the cell is pointed at,
// and stays while one of its popovers is open.
export function renderCellActions(
  row: TableRow,
  column: TableColumn,
  context: TableContext,
): TemplateResult | typeof nothing {
  if (column.isTitle) return nothing;
  const { state, dispatch } = context;
  const target = valueTarget(row.id, row.values, column.property);
  return html`<span class="database__cell-actions" data-cell-actions>
    <span class="database__cell-bar">
      ${renderCommentButton(state, dispatch, target)}
      ${renderBarButton(
        TEXT.copyValue,
        () => {
          copyValue(target.quote);
        },
        renderIcon("duplicate"),
      )}
    </span>
  </span>`;
}

// The comment popover of the value whose cell is the overlay's anchor.
export function renderCellComments(
  context: TableContext,
): TemplateResult | typeof nothing {
  const { model, state, dispatch } = context;
  const [rowKey = "", propertyKey = ""] = (
    state.ui.overlay?.anchorId ?? ""
  ).split(":");
  const row = model.rows.find((item) => item.id === rowKey);
  const property = model.database.props.properties.find(
    (item) => item.id === propertyKey,
  );
  if (row === undefined || property === undefined) return nothing;
  return renderValueComments(
    state,
    dispatch,
    valueTarget(row.id, row.values, property),
  );
}
