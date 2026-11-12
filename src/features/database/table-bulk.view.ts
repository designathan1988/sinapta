// The bar over a table while rows are ticked: how many, a button per
// property to give them all one value, and duplicating, deleting or
// unticking them.
import { html, nothing, type TemplateResult } from "lit-html";
import { closeOverlay, openOverlay } from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { isOpenFor } from "./database-overlay.ts";
import { propertyType } from "./property-registry.ts";
import {
  deleteRows,
  duplicateRows,
  selectRows,
  selectRowsCopySize,
} from "./row-bulk.commands.ts";
import { selectTickedRows } from "./row-selection.selectors.ts";
import type { TableContext } from "./table-cell.view.ts";
import { BULK_EDIT_OVERLAY } from "./table-bulk-edit.view.ts";

const EDITABLE = new Set([
  "text",
  "number",
  "date",
  "url",
  "toggle",
  "options",
]);

// A button per property that can take one value for every ticked row,
// as Notion's bar; each opens the editor of that value beside it.
function renderEditButtons(context: TableContext): TemplateResult[] {
  const { model, state, dispatch } = context;
  const properties = model.database.props.properties.filter((property) =>
    EDITABLE.has(propertyType(property.type).editor),
  );
  return properties.map((property) => {
    const overlay = { kind: BULK_EDIT_OVERLAY, anchorId: property.id };
    const isOpen = isOpenFor(state, overlay);
    return html`<button
      type="button"
      class="button database__bulk-property"
      data-variant="quiet"
      data-overlay-anchor
      aria-haspopup="dialog"
      aria-expanded=${String(isOpen)}
      @click=${() => {
        dispatch(
          isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay }),
        );
      }}
    >
      ${renderIcon(propertyType(property.type).icon)}<span
        >${property.name}</span
      >
    </button>`;
  });
}

export function renderBulkBar(
  context: TableContext,
): TemplateResult | typeof nothing {
  const { model, state, dispatch } = context;
  const rowIds = selectTickedRows(state, model);
  if (rowIds.length === 0) return nothing;
  const duplicate = (): void => {
    const size = selectRowsCopySize(state, rowIds);
    dispatch(duplicateRows.create({ rowIds, ...size }));
  };
  return html`<div
    class="database__bulk"
    role="toolbar"
    aria-label=${COPY.database.selectedRows}
  >
    <span class="database__bulk-count"
      >${rowIds.length} ${COPY.database.selected}</span
    >
    ${renderEditButtons(context)}
    ${renderButton({
      label: COPY.database.duplicateRows,
      icon: "duplicate",
      onClick: duplicate,
    })}
    ${renderButton({
      label: COPY.database.deleteRows,
      icon: "trash",
      onClick: () => dispatch(deleteRows.create({ rowIds })),
    })}
    ${renderButton({
      label: COPY.database.clearSelection,
      icon: "close",
      isIconOnly: true,
      onClick: () => dispatch(selectRows.create({ rowIds: [] })),
    })}
  </div>`;
}
