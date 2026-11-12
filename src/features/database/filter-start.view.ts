// The filter of a view that has none yet, as Notion opens it: a list of
// the properties to filter by, searchable; choosing one adds a condition
// on it and opens it by its pill.
import type { TemplateResult } from "lit-html";
import type { FilterGroup } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  setOverlayQuery,
  type OpenOverlay,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderMenu, type MenuItem } from "../../ui/menu/index.ts";
import { addFilter } from "./filter-edit.ts";
import { firstOperator } from "./filter-fields.ts";
import {
  isSimpleFilter,
  ruleAnchorId,
  VIEW_FILTER_RULE_OVERLAY,
} from "./filter-rule-anchor.ts";
import { propertyType } from "./property-registry.ts";
import type { TableContext } from "./table-cell.view.ts";
import { titleProperty } from "./table-model.selectors.ts";
import { setViewFilter } from "./view.commands.ts";
import { VIEW_FILTER_PILL_OVERLAY } from "./view-pills.view.ts";

// The new rule opens by its pill, as Notion's; a rule added to an
// advanced filter opens with the others.
function openedRule(context: TableContext, filter: FilterGroup): OpenOverlay {
  const { holderId } = context.model;
  if (!isSimpleFilter(filter))
    return { kind: VIEW_FILTER_PILL_OVERLAY, anchorId: holderId };
  const index = filter.items.length - 1;
  return {
    kind: VIEW_FILTER_RULE_OVERLAY,
    anchorId: ruleAnchorId(holderId, index),
  };
}

export function renderFilterStart(context: TableContext): TemplateResult {
  const { model, state, dispatch } = context;
  const title = titleProperty();
  const { properties } = model.database.props;
  const all = title === undefined ? properties : [title, ...properties];
  const items = all.map((property): MenuItem => ({
    label: property.name,
    icon: propertyType(property.type).icon,
    keepsOpen: true,
    onSelect: () => {
      const condition = {
        propertyId: property.id,
        operator: firstOperator(property),
        value: "",
      };
      const filter = addFilter(model.view.filter, [], condition);
      dispatch(setViewFilter.create({ viewId: model.view.id, filter }));
      dispatch(openOverlay.create({ overlay: openedRule(context, filter) }));
    },
  }));
  return renderMenu({
    label: COPY.database.filter,
    items,
    search: {
      placeholder: COPY.database.filterBy,
      query: state.ui.overlay?.query ?? "",
      onQuery: (query) => dispatch(setOverlayQuery.create({ query })),
    },
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
