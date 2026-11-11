// The files of a files cell in a popover: add a link, upload, remove.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { parseBlockId } from "../../model/index.ts";
import { closeOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  focusOverlayAnchor,
  showPopoverWhenConnected,
} from "../../ui/overlay/index.ts";
import { readFiles, renderFilesEditor } from "./properties/files/index.ts";
import { setRowValue } from "./row.commands.ts";
import type { TableContext } from "./table-cell.view.ts";

export function renderCellFiles(
  context: TableContext,
): TemplateResult | typeof nothing {
  const { model, state, dispatch } = context;
  const [row = "", propertyKey = ""] = (state.ui.overlay?.anchorId ?? "").split(
    ":",
  );
  const rowId = parseBlockId(row);
  const property = model.database.props.properties.find(
    (item) => item.id === propertyKey,
  );
  if (rowId === undefined || property === undefined) return nothing;
  const stored = model.rows.find((item) => item.id === rowId)?.values;
  const propertyId = property.id;
  const close = (): void => {
    focusOverlayAnchor();
    dispatch(closeOverlay.create({}));
  };
  return html`<div
    class="database__popover"
    popover="manual"
    data-overlay
    aria-label=${COPY.database.files}
    ${ref(showPopoverWhenConnected)}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    }}
  >
    ${renderFilesEditor({
      entries: readFiles(stored?.[propertyId]) ?? [],
      assetUrls: state.persistence.assetUrls,
      dispatch,
      onChange: (value) =>
        dispatch(setRowValue.create({ rowId, propertyId, value })),
    })}
  </div>`;
}
