// The footer of the table: under each column, the calculation the view
// works out from the rows it shows, chosen from the same menu as the
// column's own: "None", then Notion's groups of those that fit.
import "./table-footer.css";
import { html, type TemplateResult } from "lit-html";
import { COPY } from "../../ui/copy.ts";
import { renderSelect } from "../../ui/select/index.ts";
import { calculationItems } from "./column-calculate-items.ts";
import {
  calculate,
  calculationChoices,
  cappedCount,
} from "./calculations.selectors.ts";
import { renderAddRowButton } from "./database-footer.view.ts";
import type { TableContext } from "./table-cell.view.ts";
import type { TableColumn } from "./table-model.selectors.ts";

function renderCalculation(
  column: TableColumn,
  context: TableContext,
): TemplateResult {
  const { property } = column;
  const { model, state, dispatch } = context;
  const kind = model.view.calculations[property.id];
  const isCapped = model.view.countCap === true;
  const result =
    kind === undefined
      ? ""
      : cappedCount(calculate(model.rows, property, kind), kind, isCapped);

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
        menu: { items: calculationItems(column, context) },
        placeholder: COPY.database.calculate,
        variant: "quiet",
        // The menu's own rows choose.
        onChoose: () => undefined,
      },
      { overlay: state.ui.overlay, dispatch },
    )}
    <span class="database__calc-value">${result}</span>
  </td>`;
}

// "New page" right under the last row, then the calculations, as Notion's.
export function renderTableFooter(context: TableContext): TemplateResult {
  const span = context.model.columns.length + 1;
  return html`<tfoot>
    <tr class="database__new-row">
      <td class="database__gutter"></td>
      <td class="database__new-cell" colspan=${span}>
        ${renderAddRowButton(context)}
      </td>
    </tr>
    <tr class="database__calc-row">
      <td class="database__gutter"></td>
      ${context.model.columns.map((column) =>
        renderCalculation(column, context),
      )}
      <td class="database__calc" data-filler></td>
    </tr>
  </tfoot>`;
}
