// The row under a view's toolbar while the view sorts or filters, as
// Notion's: a pill for the sorts, one for the filter rules, and "Add
// filter"; each opens its popover beside it.
import "./view-pills.css";
import { html, nothing, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { PropertyId } from "../../model/index.ts";
import { closeOverlay, openOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon, type IconName } from "../../ui/icon/index.ts";
import { isOpenFor } from "./database-overlay.ts";
import { filterLabel } from "./filter-label.ts";
import {
  isSimpleFilter,
  ruleAnchorId,
  VIEW_FILTER_RULE_OVERLAY,
} from "./filter-rule-anchor.ts";
import { filterCount, isFilterGroup } from "./filter-match.ts";
import { propertyType } from "./property-registry.ts";
import type { TableContext } from "./table-cell.view.ts";
import { titleProperty } from "./table-model.selectors.ts";

// Each pill opens its popover by its own kind, so that the popover sits
// by the pill that opened it, not by the toolbar's button.
export const VIEW_SORT_PILL_OVERLAY = "view-sort-pill";
export const VIEW_FILTER_PILL_OVERLAY = "view-filter-pill";
export const VIEW_FILTER_ADD_OVERLAY = "view-filter-add";

interface Pill {
  readonly kind: string;
  readonly anchorId: string;
  readonly label: string;
  readonly icon: IconName;
  // A rule that applies, drawn in blue; "Add filter" is quiet.
  readonly isRule: boolean;
}

function propertyOf(
  context: TableContext,
  id: PropertyId,
): PropertyDefinition | undefined {
  const { properties } = context.model.database.props;
  return [titleProperty(), ...properties].find(
    (property) => property?.id === id,
  );
}

function propertyName(context: TableContext, id: PropertyId): string {
  return propertyOf(context, id)?.name ?? "";
}

function renderPill(pill: Pill, context: TableContext): TemplateResult {
  const overlay = { kind: pill.kind, anchorId: pill.anchorId };
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
    ${renderIcon(pill.icon)}<span>${pill.label}</span>${
      pill.isRule ? renderIcon("chevron") : nothing
    }
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
  return {
    kind: VIEW_SORT_PILL_OVERLAY,
    anchorId: context.model.holderId,
    label,
    icon: "sort",
    isRule: true,
  };
}

// A pill for each rule of a simple filter, as Notion's; an advanced
// filter, with groups or joined by or, counts its rules on one pill.
function filterPills(context: TableContext): Pill[] {
  const { filter } = context.model.view;
  const { holderId } = context.model;
  const count = filterCount(filter);
  if (count === 0) return [];
  if (!isSimpleFilter(filter)) {
    const label = COPY.database.ruleCount(count);
    const kind = VIEW_FILTER_PILL_OVERLAY;
    return [{ kind, anchorId: holderId, label, icon: "filter", isRule: true }];
  }
  return filter.items.flatMap((rule, index): Pill[] => {
    if (isFilterGroup(rule)) return [];
    const property = propertyOf(context, rule.propertyId);
    return [
      {
        kind: VIEW_FILTER_RULE_OVERLAY,
        anchorId: ruleAnchorId(holderId, index),
        label:
          property === undefined
            ? ""
            : filterLabel(rule, property, context.state),
        // The property's own icon, as Notion's rule pills show.
        icon:
          property === undefined ? "filter" : propertyType(property.type).icon,
        isRule: true,
      },
    ];
  });
}

export function renderViewPills(
  context: TableContext,
): TemplateResult | typeof nothing {
  const sort = sortPill(context);
  const filters = filterPills(context);
  if (sort === undefined && filters.length === 0) return nothing;
  const add: Pill = {
    kind: VIEW_FILTER_ADD_OVERLAY,
    anchorId: context.model.holderId,
    label: COPY.database.addFilter,
    icon: "plus",
    isRule: false,
  };
  return html`<div
    class="database__pills"
    role="group"
    aria-label=${COPY.database.sortsAndFilters}
  >
    ${[sort, ...filters, add].map((pill) =>
      pill === undefined ? nothing : renderPill(pill, context),
    )}
  </div>`;
}
