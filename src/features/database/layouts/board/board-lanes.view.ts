// A board with sub-groups, as Notion's: the column headers once at the
// top, then a lane per sub-group, each with a toggle, its chip and count,
// and a cell under each column.
import "./board-lanes.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { renderChip } from "../../../../ui/chip/index.ts";
import { renderIcon } from "../../../../ui/icon/index.ts";
import { toggleSubGroupCollapsed } from "../../sub-group.commands.ts";
import type { BoardContext } from "./board-cards.view.ts";
import { renderColumn, renderColumnHeader } from "./board-column.view.ts";
import type { BoardLane, BoardLanes } from "./board.selectors.ts";

function renderLane(
  context: BoardContext,
  lanes: BoardLanes,
  lane: BoardLane,
): TemplateResult {
  const value = lanes.valueFor?.(lane.key);
  const values = value === undefined ? {} : { [lanes.property.id]: value };
  const viewId = context.model.view.id;
  const toggle = (): void => {
    context.dispatch(toggleSubGroupCollapsed.create({ viewId, key: lane.key }));
  };
  const columns = lane.columns.filter((column) => !column.isHidden);
  return html`<section
    class="board__lane"
    data-lane-key=${lane.key}
    aria-label=${lane.label}
  >
    <button
      type="button"
      class="board__lane-head"
      aria-expanded=${String(!lane.isCollapsed)}
      @click=${toggle}
    >
      ${renderIcon("chevron")} ${renderChip(lane.label, lane.color ?? "gray")}
      <span class="board__count">${lane.rows.length}</span>
    </button>
    ${
      lane.isCollapsed
        ? nothing
        : html`<div class="board__lane-columns">
            ${columns.map((column) => renderColumn(context, column, { values }))}
          </div>`
    }
  </section>`;
}

export function renderLanes(
  context: BoardContext,
  lanes: BoardLanes,
): TemplateResult {
  const columns = context.board.columns.filter((column) => !column.isHidden);
  return html`<div class="board__heads">
      ${columns.map(
        (column) =>
          html`<div
            class="board__column board__head"
            data-color=${column.color ?? "gray"}
          >
            ${renderColumnHeader(context, column)}
          </div>`,
      )}
    </div>
    ${lanes.lanes.map((lane) => renderLane(context, lanes, lane))}`;
}
