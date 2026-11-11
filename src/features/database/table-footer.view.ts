// The footer of the table: under each column, the calculation the view
// works out from the rows it shows, chosen from those that fit the
// column. One listener reads every choice by its column.
import "./table-footer.css";
import { html, type TemplateResult } from "lit-html";
import { CALCULATION_KINDS } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import { setCalculation } from "./calculation.commands.ts";
import { calculate, calculationsFor } from "./calculations.selectors.ts";
import type { TableContext } from "./table-cell.view.ts";
import type { TableColumn } from "./table-model.selectors.ts";

function onChange(event: Event, context: TableContext): void {
  const select = event.target;
  if (!(select instanceof HTMLSelectElement)) return;
  const { model, dispatch } = context;
  const column = model.columns.find(
    (item) => item.property.id === select.dataset.propertyId,
  );
  if (column === undefined) return;
  const kind = CALCULATION_KINDS.find((item) => item === select.value) ?? null;
  const viewId = model.view.id;
  const propertyId = column.property.id;
  dispatch(setCalculation.create({ viewId, propertyId, kind }));
}

function renderCalculation(
  column: TableColumn,
  context: TableContext,
): TemplateResult {
  const { property } = column;
  const { model } = context;
  const kind = model.view.calculations[property.id];
  const labels = COPY.database.rollupFunctions;
  const result =
    kind === undefined ? "" : calculate(model.rows, property, kind);
  return html`<td class="database__calc" ?data-set=${kind !== undefined}>
    <select
      class="database__calc-kind"
      data-property-id=${property.id}
      aria-label=${`${COPY.database.calculate} ${property.name}`}
    >
      <option value="" ?selected=${kind === undefined}>
        ${COPY.database.calculate}
      </option>
      ${calculationsFor(property).map(
        (item) =>
          html`<option value=${item} ?selected=${item === kind}>
            ${labels[item]}
          </option>`,
      )}
    </select>
    <span class="database__calc-value">${result}</span>
  </td>`;
}

export function renderTableFooter(context: TableContext): TemplateResult {
  return html`<tfoot
    @change=${(event: Event) => {
      onChange(event, context);
    }}
  >
    <tr class="database__calc-row">
      ${context.model.columns.map((column) =>
        renderCalculation(column, context),
      )}
      <td class="database__calc" data-filler></td>
    </tr>
  </tfoot>`;
}
