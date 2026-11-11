// The filter of a view that has none yet, as Notion opens it: a list of
// the properties to filter by, searchable; choosing one adds a condition
// on it, and the editor of the view's filter shows in its place.
import type { TemplateResult } from "lit-html";
import { closeOverlay, setOverlayQuery } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderMenu, type MenuItem } from "../../ui/menu/index.ts";
import { addFilter } from "./filter-edit.ts";
import { firstOperator } from "./filter-fields.ts";
import { propertyType } from "./property-registry.ts";
import type { TableContext } from "./table-cell.view.ts";
import { titleProperty } from "./table-model.selectors.ts";
import { setViewFilter } from "./view.commands.ts";

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
