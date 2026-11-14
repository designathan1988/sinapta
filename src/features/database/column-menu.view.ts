// The menu of one column, as Notion's: the property's name in a field
// with its type's icon, then "Edit property" and "Change type", filter,
// sort, group and calculate, how the table shows the column, and new
// columns beside it; and the menu of property types to add.
import { editAutomationItem } from "./button-automation-item.ts";
import { nothing, type TemplateResult } from "lit-html";
import type { BlockId } from "../../model/index.ts";
import { closeOverlay, type Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  renderMenu,
  renderMenuName,
  type MenuEntry,
  type MenuItem,
} from "../../ui/menu/index.ts";
import {
  filterItem,
  groupItems,
  aiFillItem,
  showItems,
  sortItem,
} from "./column-menu-items.ts";
import { calculateItem } from "./column-calculate-items.ts";
import { placeItems } from "./column-place-items.ts";
import {
  addProperty,
  changeProperty,
  setPropertyConfig,
} from "./database.commands.ts";
import { showsAsCheckbox } from "./properties/status/index.ts";
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

// A status column's "Show as", as Notion's: as a checkbox, or as its
// options.
function statusShowAsItems(
  column: TableColumn,
  context: TableContext,
): MenuItem[] {
  const { property } = column;
  if (property.type !== "status") return [];
  const databaseId = context.model.database.id;
  const current = showsAsCheckbox(property) ? "checkbox" : "select";
  const labels = COPY.database.statusShowAs;
  const items = (["checkbox", "select"] as const).map((showAs): MenuItem => ({
    label: labels[showAs],
    icon: showAs === "checkbox" ? "checkbox" : "select",
    check: "radio",
    isChecked: showAs === current,
    onSelect: () => {
      const base = typeof property.config === "object" ? property.config : {};
      const config = { ...base, showAs };
      const propertyId = property.id;
      context.dispatch(
        setPropertyConfig.create({ databaseId, propertyId, config }),
      );
    },
  }));
  return [
    {
      label: COPY.database.showAs,
      icon: "eye",
      value: labels[current],
      submenu: {
        id: `${property.id}:show-as`,
        menu: () => ({ label: COPY.database.showAs, items }),
      },
    },
  ];
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

// A button's column, as Notion's: Edit automation and Change type, then
// Freeze, Hide and the places, without filter, sort, calculation, wrap
// or moves.
function buttonItems(column: TableColumn, context: TableContext): MenuEntry[] {
  const left = new Set<string>([
    COPY.database.wrapText,
    COPY.database.moveLeft,
    COPY.database.moveRight,
  ]);
  const keep = (entry: MenuEntry): boolean =>
    !("label" in entry) || !left.has(entry.label);
  return [
    editAutomationItem(column.property, context),
    changeTypeItem(column.property, context),
    { kind: "divider" },
    ...showItems(column, context).filter(keep),
    ...placeItems(column, context).filter(keep),
  ];
}

function columnItems(column: TableColumn, context: TableContext): MenuEntry[] {
  if (column.property.type === "button") return buttonItems(column, context);
  return [
    ...propertyItems(column, context),
    filterItem(column, context),
    sortItem(column, context),
    ...groupItems(column, context),
    calculateItem(column, context),
    ...showItems(column, context),
    ...aiFillItem(column, context),
    ...statusShowAsItems(column, context),
    ...placeItems(column, context),
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
    items: columnItems(column, context),
    context: { overlay: state.ui.overlay, dispatch },
    onClose: () => dispatch(closeOverlay.create({})),
  });
}

// The property types to add one of, from a table's "+" or a row page's
// "Add a property".
export function renderPropertyTypes(
  databaseId: BlockId,
  dispatch: Dispatch,
  opensSettings = false,
): TemplateResult {
  const items = PROPERTY_TYPES.map((type) => ({
    label: type.label,
    icon: type.icon,
    onSelect: () =>
      dispatch(
        addProperty.create({
          databaseId,
          propertyType: type.type,
          name: type.label,
          opensSettings,
        }),
      ),
  }));
  return renderMenu({
    label: COPY.database.addProperty,
    items,
    onClose: () => dispatch(closeOverlay.create({})),
  });
}

export function renderTypeMenu(context: TableContext): TemplateResult {
  return renderPropertyTypes(context.model.database.id, context.dispatch, true);
}
