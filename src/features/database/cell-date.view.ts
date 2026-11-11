// A date cell's calendar, opened from the cell as Notion opens it: the
// date picker and its rows, anchored to the cell.
import { nothing, type TemplateResult } from "lit-html";
import { parseBlockId } from "../../model/index.ts";
import { closeOverlay } from "../../state/index.ts";
import { renderMenu } from "../../ui/menu/index.ts";
import { dateMenu } from "./date-menu.ts";
import { setRowValue } from "./row.commands.ts";
import type { TableContext } from "./table-cell.view.ts";

export function renderCellDate(
  context: TableContext,
): TemplateResult | typeof nothing {
  const { model, state, dispatch } = context;
  const anchor = state.ui.overlay?.anchorId ?? "";
  const [row = "", propertyKey = ""] = anchor.split(":");
  const rowId = parseBlockId(row);
  const property = model.database.props.properties.find(
    (item) => item.id === propertyKey,
  );
  if (rowId === undefined || property === undefined) return nothing;
  const values = model.rows.find((item) => item.id === rowId)?.values;
  const menu = dateMenu({
    stored: values?.[property.id],
    label: property.name,
    overlay: state.ui.overlay,
    dispatch,
    onChange: (value) => {
      const change = { rowId, propertyId: property.id, value };
      dispatch(setRowValue.create(change));
    },
  });
  return renderMenu({
    label: property.name,
    ...(menu.lead !== undefined && { lead: menu.lead }),
    items: menu.items,
    context: { overlay: state.ui.overlay, dispatch },
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
