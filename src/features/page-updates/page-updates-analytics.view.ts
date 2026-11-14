// The Analytics tab of Notion's "Updates & analytics": the page's views
// (how many in all) as an area chart by day over the chosen period; who
// viewed it, each at their latest view; who created it and who edited it
// last.
import "./page-updates-analytics.css";
import { html, nothing, svg, type TemplateResult } from "lit-html";
import type { PageBlock } from "../../blocks/page/index.ts";
import type { AppState, Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  selectDailyViews,
  selectEditors,
  selectTimeAgo,
  selectViewers,
} from "./page-updates.selectors.ts";
import { renderPersonMark } from "./page-updates-person.view.ts";
import { renderPeriodButton } from "./page-updates-period.view.ts";
import { renderHistoryBox } from "./page-updates-history.view.ts";

const TEXT = COPY.pageUpdates;
const TICKS = 5;
// The chart's drawing box, in its own units: the axis labels sit left of
// LEFT and under BOTTOM.
const BOX = { width: 340, height: 170, left: 40, top: 8, bottom: 140 };

const DAY = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

interface Chart {
  readonly line: string;
  readonly area: string;
  readonly ticks: readonly { readonly value: number; readonly y: number }[];
}

// Where the line runs and where each tick sits, in the chart's units.
function chartOf(days: readonly { day: string; count: number }[]): Chart {
  const most = Math.max(0, ...days.map((day) => day.count));
  const step = Math.max(1, Math.ceil(most / TICKS));
  const rise = BOX.bottom - BOX.top;
  const x = (index: number) =>
    BOX.left + (index * (BOX.width - BOX.left)) / Math.max(1, days.length - 1);
  const y = (count: number) => BOX.bottom - (count * rise) / (step * TICKS);
  const points = days.map(
    (day, index) => `${String(x(index))},${String(y(day.count))}`,
  );
  const base = (at: number) => `${String(at)},${String(BOX.bottom)}`;
  return {
    line: points.join(" "),
    area: `M${base(BOX.left)} L${points.join(" L")} L${base(x(days.length - 1))} Z`,
    ticks: Array.from({ length: TICKS }, (_, index) => {
      const value = step * (index + 1);
      return { value, y: y(value) };
    }),
  };
}

// The left axis with its ticks, and the line along the bottom.
function renderAxes(chart: Chart): TemplateResult {
  return svg`${chart.ticks.map(
    (tick) =>
      svg`<line class="page-updates__axis" x1=${BOX.left - 4} x2=${BOX.left} y1=${tick.y} y2=${tick.y} /><text class="page-updates__tick" x=${BOX.left - 8} y=${tick.y} text-anchor="end" dominant-baseline="middle">${tick.value}</text>`,
  )}<line class="page-updates__axis" x1=${BOX.left} x2=${BOX.left} y1=${BOX.top} y2=${BOX.bottom} /><line class="page-updates__axis" x1=${BOX.left} x2=${BOX.width} y1=${BOX.bottom} y2=${BOX.bottom} />`;
}

function renderChart(
  days: readonly { day: string; count: number }[],
): TemplateResult {
  const chart = chartOf(days);
  const under = BOX.height - 6;
  return html`<svg
    class="page-updates__chart"
    viewBox="0 0 ${String(BOX.width)} ${String(BOX.height)}"
    role="img"
    aria-label=${TEXT.views}
  >
    ${renderAxes(chart)}
    <path class="page-updates__area" d=${chart.area} />
    <polyline class="page-updates__line-chart" points=${chart.line} />
    <text
      class="page-updates__tick"
      x=${BOX.left}
      y=${under}
      text-anchor="middle"
    >
      ${DAY.format(Date.parse(days[0]?.day ?? ""))}
    </text>
    <text
      class="page-updates__tick"
      x=${BOX.width}
      y=${under}
      text-anchor="end"
    >
      ${DAY.format(Date.parse(days.at(-1)?.day ?? ""))}
    </text>
  </svg>`;
}

function renderPerson(name: string, at: string, now: string): TemplateResult {
  return html`<li class="page-updates__person">
    ${renderPersonMark(name)}
    <span class="page-updates__name">${name}</span>
    <time datetime=${at}>${selectTimeAgo(at, now)}</time>
  </li>`;
}

function renderEditors(state: AppState, page: PageBlock, now: string) {
  const { created, edited } = selectEditors(state, page);
  const you = state.persistence.account.user?.name ?? TEXT.you;
  return html`<h3 class="page-updates__heading">${TEXT.editors}</h3>
    <p class="page-updates__caption">${TEXT.createdBy}</p>
    <ul class="page-updates__people">
      ${renderPerson(created.name ?? you, created.at, now)}
    </ul>
    <p class="page-updates__caption">${TEXT.editedBy}</p>
    <ul class="page-updates__people">
      ${renderPerson(edited.name ?? you, edited.at, now)}
    </ul>`;
}

export function renderAnalytics(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult {
  const now = new Date().toISOString();
  const views = state.ui.pageUpdates?.views ?? [];
  const { days, total } = selectDailyViews(
    views,
    now,
    state.ui.pageUpdates?.period,
  );
  const you = state.persistence.account.user?.name ?? TEXT.you;
  return html`<div class="page-updates__views-head">
      <h3 class="page-updates__heading">
        ${TEXT.views}
        <span class="page-updates__total">${TEXT.total(total)}</span>
      </h3>
      ${renderPeriodButton(state, dispatch)}
    </div>
    ${renderChart(days)}
    <h3 class="page-updates__heading">${TEXT.viewers}</h3>
    ${renderHistoryBox(state, dispatch)}
    ${
      views.length === 0
        ? html`<p class="page-updates__empty">${TEXT.noViews}</p>`
        : nothing
    }
    <ul class="page-updates__people">
      ${selectViewers(views).map((viewer) =>
        renderPerson(viewer.viewer ?? you, viewer.viewedAt, now),
      )}
    </ul>
    ${renderEditors(state, page, now)}`;
}
