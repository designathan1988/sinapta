// The files of a row, on the row's own page.
import { html, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { PageBlock } from "../../blocks/page/index.ts";
import type { AppState, Dispatch } from "../../state/index.ts";
import { readFiles, renderFilesEditor } from "./properties/files/index.ts";
import { setRowValue } from "./row.commands.ts";

export interface RowPage {
  readonly state: AppState;
  readonly dispatch: Dispatch;
}

export function renderRowFiles(
  row: PageBlock,
  property: PropertyDefinition,
  page: RowPage,
): TemplateResult {
  const { dispatch } = page;
  const rowId = row.id;
  const propertyId = property.id;
  return html`<fieldset
    class="database__row-property"
    data-property-id=${property.id}
  >
    <legend class="database__row-name">${property.name}</legend>
    ${renderFilesEditor({
      entries: readFiles(row.props.values?.[property.id]) ?? [],
      assetUrls: page.state.persistence.assetUrls,
      dispatch,
      onChange: (value) =>
        dispatch(setRowValue.create({ rowId, propertyId, value })),
    })}
  </fieldset>`;
}
