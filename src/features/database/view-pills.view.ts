// The row under a view's toolbar while the view sorts or filters, as
// Notion's: a pill for the sorts, one for the filter rules, and "Add
// filter"; each opens its popover beside it.
import "./view-pills.css";
import { html, nothing, type TemplateResult } from "lit-html";
import type { PropertyId } from "../../model/index.ts";
import { closeOverlay, openOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon, type IconName } from "../../ui/icon/index.ts";
import { isOpenFor } from "./database-overlay.ts";
import { filterCount, isFilterGroup } from "./filter-match.ts";
import type { TableContext } from "./table-cell.view.ts";
import { titleProperty } from "./table-model.selectors.ts";

// Each pill opens its popover by its own kind, so that the popover sits
// by the pill that opened it, not by the toolbar's button.
export const VIEW_SORT_PILL_OVERLAY = "view-sort-pill";
export const VIEW_FILTER_PILL_OVERLAY = "view-filter-pill";
export const VIEW_FILTER_ADD_OVERLAY = "view-filter-add";

interface Pill {
  readonly kind: string;
  readonly label: string;
  readonly icon: IconName;
  // A rule that applies, drawn in blue; "Add filter" is quiet.
  readonly isRule: boolean;
}

function propertyName(context: TableContext, id: PropertyId): string {
  const { properties } = context.model.database.props;
  const all = [titleProperty(), ...properties];
  return all.find((property) => property?.id === id)?.name ?? "";
}

function renderPill(pill: Pill, context: TableContext): TemplateResult {
  const overlay = { kind: pill.kind, anchorId: context.model.holderId };
  const isOpen = isOpenFor(context.state, overlay);
  const toggle = (): void => {
    context.dispatch(
      isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay }),
    );
  };
  return html`<button
    type="button"
    class="database__pill"
    ?data-rule=${pill.isRule}
    data-overlay-anchor
    aria-haspopup="dialog"
    aria-expanded=${String(isOpen)}
    @click=${toggle}
  >
    ${renderIcon(pill.icon)}<span>${pill.label}</span>
  </button>`;
}

function sortPill(context: TableContext): Pill | undefined {
  const { sorts } = context.model.view;
  const [first] = sorts;
  if (first === undefined) return undefined;
  const label =
    sorts.length === 1
      ? propertyName(context, first.propertyId)
      : COPY.database.sortCount(sorts.length);
  return { kind: VIEW_SORT_PILL_OVERLAY, label, icon: "sort", isRule: true };
}

function filterPill(context: TableContext): Pill | undefined {
  const { filter } = context.model.view;
  const count = filterCount(filter);
  const [first] = filter.items;
  if (first === undefined || count === 0) return undefined;
  const label =
    count === 1 && !isFilterGroup(first)
      ? propertyName(context, first.propertyId)
      : COPY.database.ruleCount(count);
  return {
    kind: VIEW_FILTER_PILL_OVERLAY,
    label,
    icon: "filter",
    isRule: true,
  };
}

export function renderViewPills(
  context: TableContext,
): TemplateResult | typeof nothing {
  const sort = sortPill(context);
  const filter = filterPill(context);
  if (sort === undefined && filter === undefined) return nothing;
  const add: Pill = {
    kind: VIEW_FILTER_ADD_OVERLAY,
    label: COPY.database.addFilter,
    icon: "plus",
    isRule: false,
  };
  return html`<div
    class="database__pills"
    role="group"
    aria-label=${COPY.database.sortsAndFilters}
  >
    ${[sort, filter, add].map((pill) =>
      pill === undefined ? nothing : renderPill(pill, context),
    )}
  </div>`;
}
