// The menu of one column, as Notion's: the property's name in a field
// with its type's icon, then "Edit property" and "Change type", filter,
// sort, group and calculate, how the table shows the column, and new
// columns beside it; and the menu of property types to add.
import { nothing, type TemplateResult } from "lit-html";
import { closeOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  renderMenu,
  renderMenuName,
  type MenuEntry,
} from "../../ui/menu/index.ts";
import {
  calculateItem,
  filterItem,
  groupItems,
  showItems,
  sortItem,
} from "./column-menu-items.ts";
import { placeItems } from "./column-place-items.ts";
import { addProperty, changeProperty } from "./database.commands.ts";
import { changeTypeItem, editPropertyItem } from "./property-edit-menu.ts";
import { PROPERTY_TYPES, propertyType } from "./property-registry.ts";
import type { TableContext } from "./table-cell.view.ts";
import type { TableColumn } from "./table-model.selectors.ts";

// The name with its type's icon, focused when the menu opens.
function renderName(
  column: TableColumn,
  context: TableContext,
): TemplateResult {
  const databaseId = context.model.database.id;
  const { property } = column;
  return renderMenuName({
    icon: propertyType(property.type).icon,
    label: COPY.database.propertyName,
    value: property.name,
    onRename: (name) =>
      context.dispatch(
        changeProperty.create({ databaseId, propertyId: property.id, name }),
      ),
  });
}

// The property's own settings; the title column keeps its type.
function propertyItems(
  column: TableColumn,
  context: TableContext,
): MenuEntry[] {
  if (column.isTitle) return [];
  return [
    editPropertyItem(column.property, context),
    changeTypeItem(column.property, context),
    { kind: "divider" },
  ];
}

export function renderColumnMenu(
  context: TableContext,
): TemplateResult | typeof nothing {
  const { state, model, dispatch } = context;
  const anchorId = state.ui.overlay?.anchorId;
  const column = model.columns.find((item) => item.property.id === anchorId);
  if (column === undefined) return nothing;
  return renderMenu({
    label: COPY.database.columnActions,
    ...(column.isTitle ? {} : { lead: renderName(column, context) }),
    items: [
      ...propertyItems(column, context),
      filterItem(column, context),
      sortItem(column, context),
      ...groupItems(column, context),
      calculateItem(column, context),
      ...showItems(column, context),
      ...placeItems(column, context),
    ],
    context: { overlay: state.ui.overlay, dispatch },
    onClose: () => dispatch(closeOverlay.create({})),
  });
}

export function renderTypeMenu(context: TableContext): TemplateResult {
  const databaseId = context.model.database.id;
  const items = PROPERTY_TYPES.map((type) => ({
    label: type.label,
    icon: type.icon,
    onSelect: () =>
      context.dispatch(
        addProperty.create({
          databaseId,
          propertyType: type.type,
          name: type.label,
        }),
      ),
  }));
  return renderMenu({
    label: COPY.database.addProperty,
    items,
    onClose: () => context.dispatch(closeOverlay.create({})),
  });
}
