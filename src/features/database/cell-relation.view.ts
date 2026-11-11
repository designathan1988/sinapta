// The related pages of a relation cell in a popover.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { parseBlockId } from "../../model/index.ts";
import { closeOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  focusOverlayAnchor,
  showPopoverWhenConnected,
} from "../../ui/overlay/index.ts";
import {
  readRelation,
  renderRelationEditor,
  selectRelationChoices,
  setRelationValue,
} from "./properties/relation/index.ts";
import type { TableContext } from "./table-cell.view.ts";

export function renderCellRelation(
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
    aria-label=${COPY.database.relatedPages}
    ${ref(showPopoverWhenConnected)}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    }}
  >
    ${renderRelationEditor({
      selected: readRelation(stored?.[propertyId]) ?? [],
      choices: selectRelationChoices(state, property),
      onChange: (ids) => {
        const value = ids.flatMap((id) => parseBlockId(id) ?? []);
        dispatch(setRelationValue.create({ rowId, propertyId, value }));
      },
    })}
  </div>`;
}
