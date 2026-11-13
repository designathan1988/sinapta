// The files of a files cell in a popover: add a link, upload, remove.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { parseBlockId } from "../../model/index.ts";
import { closeOverlay, setOverlayValues } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  focusOverlayAnchor,
  showPopoverWhenConnected,
} from "../../ui/overlay/index.ts";
import {
  readFiles,
  renderFilesEditor,
  type FilesTab,
} from "./properties/files/index.ts";
import { setRowValue } from "./row.commands.ts";
import type { TableContext } from "./table-cell.view.ts";

const FILES_TAB = "files-tab";

// Notion opens on Upload; the tab chosen lives in the overlay.
function chosenTab(state: TableContext["state"]): FilesTab {
  return state.ui.overlay?.values?.[FILES_TAB]?.[0] === "link"
    ? "link"
    : "upload";
}

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
  return html`<div
    class="database__popover"
    popover="manual"
    data-overlay
    aria-label=${COPY.database.files}
    ${ref(showPopoverWhenConnected)}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      focusOverlayAnchor();
      dispatch(closeOverlay.create({}));
    }}
  >
    ${renderFilesEditor({
      entries: readFiles(stored?.[propertyId]) ?? [],
      assetUrls: state.persistence.assetUrls,
      dispatch,
      onChange: (value) =>
        dispatch(setRowValue.create({ rowId, propertyId, value })),
      tab: chosenTab(state),
      onTab: (tab) =>
        dispatch(setOverlayValues.create({ name: FILES_TAB, values: [tab] })),
    })}
  </div>`;
}
