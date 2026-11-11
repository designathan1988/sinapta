// The marks of each kind of chart: columns and bars as blocks sized by
// their share of the largest value, a line through the groups, and a
// donut's slices by their share of the total. Shares are set through the
// CSSOM; colors come from each group's color in the stylesheet.
import { html, nothing, svg, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type { Chart, ChartPoint } from "./chart.selectors.ts";

// A mark's share, between 0 and 1, as a custom property.
function share(value: number) {
  return (element: Element | undefined): void => {
    if (element instanceof HTMLElement || element instanceof SVGElement) {
      element.style.setProperty("--share", String(value));
    }
  };
}

function ratio(value: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((value / whole) * 1000) / 1000;
}

const VALUE = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function formatValue(value: number): string {
  return VALUE.format(value);
}

function renderMark(point: ChartPoint, chart: Chart): TemplateResult {
  return html`<div class="chart__item">
    <span class="chart__value">${formatValue(point.value)}</span>
    <span class="chart__track">
      <span
        class="chart__mark"
        data-color=${point.color ?? nothing}
        ${ref(share(ratio(point.value, chart.max)))}
      ></span>
    </span>
    <span class="chart__label">${point.label}</span>
  </div>`;
}

// Columns rise and bars reach across by the same marks, laid out by the
// chart's kind in the stylesheet.
export function renderBlocks(chart: Chart): TemplateResult {
  return html`<div class="chart__blocks">
    ${chart.points.map((point) => renderMark(point, chart))}
  </div>`;
}

export function linePoints(chart: Chart): string {
  const last = Math.max(1, chart.points.length - 1);
  return chart.points
    .map((point, index) => {
      const x = Math.round((index / last) * 100);
      const y = Math.round((1 - ratio(point.value, chart.max)) * 100);
      return `${String(x)},${String(y)}`;
    })
    .join(" ");
}

export function renderLine(chart: Chart): TemplateResult {
  return html`<div class="chart__plot">
      <svg
        class="chart__svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        ${svg`<polyline class="chart__line" points=${linePoints(chart)} />`}
      </svg>
    </div>
    <div class="chart__labels">
      ${chart.points.map(
        (point) => html`<span class="chart__label">${point.label}</span>`,
      )}
    </div>`;
}

// A slice is a dash of a circle drawn on a path 100 long: its length is
// its share of the total, its start where the slices before it end.
export function renderDonut(chart: Chart): TemplateResult {
  let before = 0;
  const slices = chart.points.map((point) => {
    const length = ratio(point.value, chart.total) * 100;
    const offset = 25 - before;
    before += length;
    return svg`<circle
      class="chart__slice"
      cx="21" cy="21" r="15.9"
      pathLength="100"
      data-color=${point.color ?? nothing}
      stroke-dasharray=${`${String(length)} ${String(100 - length)}`}
      stroke-dashoffset=${String(offset)}
    />`;
  });
  return html`<div class="chart__donut">
    <svg class="chart__svg" viewBox="0 0 42 42" aria-hidden="true">
      ${slices}
    </svg>
    <ul class="chart__legend">
      ${chart.points.map(
        (point) =>
          html`<li class="chart__legend-item">
            <span
              class="chart__swatch"
              data-color=${point.color ?? nothing}
            ></span>
            ${point.label}
            <span class="chart__value">${formatValue(point.value)}</span>
          </li>`,
      )}
    </ul>
  </div>`;
}
