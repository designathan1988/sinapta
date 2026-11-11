// The footer of the table: under each column, the calculation the view
// works out from the rows it shows, chosen from a list of those that fit
// the column, "None" first, as in Notion.
import "./table-footer.css";
import { html, type TemplateResult } from "lit-html";
import { CALCULATION_KINDS } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderSelect } from "../../ui/select/index.ts";
import { setCalculation } from "./calculation.commands.ts";
import { calculate, calculationChoices } from "./calculations.selectors.ts";
import type { TableContext } from "./table-cell.view.ts";
import type { TableColumn } from "./table-model.selectors.ts";

function renderCalculation(
  column: TableColumn,
  context: TableContext,
): TemplateResult {
  const { property } = column;
  const { model, state, dispatch } = context;
  const kind = model.view.calculations[property.id];
  const result =
    kind === undefined ? "" : calculate(model.rows, property, kind);
  const choose = (value: string): void => {
    const chosen = CALCULATION_KINDS.find((item) => item === value) ?? null;
    const viewId = model.view.id;
    const propertyId = property.id;
    dispatch(setCalculation.create({ viewId, propertyId, kind: chosen }));
  };
  return html`<td
    class="database__calc"
    data-property-id=${property.id}
    ?data-set=${kind !== undefined}
  >
    ${renderSelect(
      {
        id: `calculate-${model.view.id}-${property.id}`,
        label: `${COPY.database.calculate} ${property.name}`,
        value: kind,
        options: calculationChoices(column.property),
        placeholder: COPY.database.calculate,
        variant: "quiet",
        onChoose: choose,
      },
      { overlay: state.ui.overlay, dispatch },
    )}
    <span class="database__calc-value">${result}</span>
  </td>`;
}

export function renderTableFooter(context: TableContext): TemplateResult {
  return html`<tfoot>
    <tr class="database__calc-row">
      <td class="database__gutter"></td>
      ${context.model.columns.map((column) =>
        renderCalculation(column, context),
      )}
      <td class="database__calc" data-filler></td>
    </tr>
  </tfoot>`;
}
