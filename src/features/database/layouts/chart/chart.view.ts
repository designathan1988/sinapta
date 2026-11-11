// A chart of the view's rows, as Notion's: columns, bars, a line or a
// donut, a group each, with the same numbers in a table for screen
// readers.
import "./chart.css";
import { html, type TemplateResult } from "lit-html";
import { COPY } from "../../../../ui/copy.ts";
import type { TableContext } from "../../table-cell.view.ts";
import {
  formatValue,
  renderBlocks,
  renderDonut,
  renderLine,
} from "./chart-marks.ts";
import { selectChart, type Chart } from "./chart.selectors.ts";

const TEXT = COPY.database;

function renderTable(chart: Chart, caption: string): TemplateResult {
  return html`<table class="visually-hidden">
    <caption>
      ${caption}
    </caption>
    <thead>
      <tr>
        <th scope="col">${chart.property.name}</th>
        <th scope="col">${TEXT.chartValue}</th>
      </tr>
    </thead>
    <tbody>
      ${chart.points.map(
        (point) =>
          html`<tr>
            <th scope="row">${point.label}</th>
            <td>${formatValue(point.value)}</td>
          </tr>`,
      )}
    </tbody>
  </table>`;
}

export function renderChart(context: TableContext): TemplateResult {
  const chart = selectChart(context.model);
  if (chart === undefined) {
    return html`<p class="chart__empty">${TEXT.noChartProperty}</p>`;
  }
  const { kind } = context.model.view.chart;
  const caption = `${context.model.view.name}: ${chart.property.name}`;
  const marks =
    kind === "donut"
      ? renderDonut(chart)
      : kind === "line"
        ? renderLine(chart)
        : renderBlocks(chart);
  return html`<figure class="chart" data-kind=${kind}>
    <div aria-hidden="true">${marks}</div>
    ${renderTable(chart, caption)}
  </figure>`;
}
