// The view's sorts, as Notion's view settings show them: with none, the
// properties to sort by; with some, a row per sort with its property, its
// direction and Remove, then "Add sort" and "Delete sort".
import { html, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../../blocks/database/index.ts";
import { COPY } from "../../../ui/copy.ts";
import { renderIcon } from "../../../ui/icon/index.ts";
import type { MenuItem } from "../../../ui/menu/index.ts";
import { renderSelect } from "../../../ui/select/index.ts";
import { propertyType } from "../property-registry.ts";
import type { TableContext } from "../table-cell.view.ts";
import { titleProperty } from "../table-model.selectors.ts";
import { setViewSorts, sortByProperty, type Sort } from "../view.commands.ts";
import { goTo, type SettingsPanel } from "./settings-panel.ts";

const TEXT = COPY.database;

// The title, then every property, as Notion lists what a view sorts by.
function sortable(context: TableContext): PropertyDefinition[] {
  const title = titleProperty();
  const { properties } = context.model.database.props;
  return title === undefined ? [...properties] : [title, ...properties];
}

function setSorts(context: TableContext, sorts: readonly Sort[]): void {
  const viewId = context.model.view.id;
  context.dispatch(setViewSorts.create({ viewId, sorts }));
}

// One sort of the view, where it is among them.
interface SortAt {
  readonly sort: Sort;
  readonly index: number;
}

function replaceSort(context: TableContext, at: SortAt, next: Sort): void {
  setSorts(context, context.model.view.sorts.toSpliced(at.index, 1, next));
}

function selectContext(context: TableContext) {
  return { overlay: context.state.ui.overlay, dispatch: context.dispatch };
}

function renderProperty(at: SortAt, context: TableContext): TemplateResult {
  const properties = sortable(context);
  return renderSelect(
    {
      id: `sort-${context.model.view.id}-${String(at.index)}-property`,
      label: TEXT.sortProperty,
      value: at.sort.propertyId,
      options: properties.map((property) => ({
        value: property.id,
        label: property.name,
        icon: propertyType(property.type).icon,
      })),
      variant: "quiet",
      onChoose: (value) => {
        const chosen = properties.find((one) => one.id === value);
        if (chosen === undefined) return;
        replaceSort(context, at, { ...at.sort, propertyId: chosen.id });
      },
    },
    selectContext(context),
  );
}

function renderDirection(at: SortAt, context: TableContext): TemplateResult {
  return renderSelect(
    {
      id: `sort-${context.model.view.id}-${String(at.index)}-direction`,
      label: TEXT.sortDirection,
      value: at.sort.direction,
      options: [
        { value: "ascending", label: TEXT.ascending },
        { value: "descending", label: TEXT.descending },
      ],
      variant: "quiet",
      onChoose: (value) => {
        const direction = value === "descending" ? "descending" : "ascending";
        replaceSort(context, at, { ...at.sort, direction });
      },
    },
    selectContext(context),
  );
}

// One sort: the grip, its property and direction, and Remove.
function renderSort(at: SortAt, context: TableContext): TemplateResult {
  const remove = (): void => {
    setSorts(context, context.model.view.sorts.toSpliced(at.index, 1));
  };
  return html`<div class="view-settings__sort">
    ${renderIcon("grip")} ${renderProperty(at, context)}
    ${renderDirection(at, context)}
    <button
      type="button"
      class="view-settings__remove"
      aria-label=${TEXT.removeSort}
      @click=${remove}
    >
      ${renderIcon("close")}
    </button>
  </div>`;
}

export function sortPanel(context: TableContext): SettingsPanel {
  const { sorts } = context.model.view;
  const items: MenuItem[] = [
    {
      label: TEXT.addSort,
      icon: "plus",
      opensPanel: true,
      onSelect: () => {
        goTo(context, "sort-add");
      },
    },
    {
      label: TEXT.deleteSort,
      icon: "trash",
      keepsOpen: true,
      onSelect: () => {
        setSorts(context, []);
        goTo(context, null);
      },
    },
  ];
  return {
    title: TEXT.sort,
    back: null,
    lead: html`<div class="view-settings__sorts">
      ${sorts.map((sort, index) => renderSort({ sort, index }, context))}
    </div>`,
    items,
  };
}

// The properties not yet sorted by, to choose the next sort from.
export function sortAddPanel(context: TableContext): SettingsPanel {
  const { view } = context.model;
  const sorted = new Set(view.sorts.map((sort) => sort.propertyId));
  const items = sortable(context)
    .filter((property) => !sorted.has(property.id))
    .map((property): MenuItem => ({
      label: property.name,
      icon: propertyType(property.type).icon,
      keepsOpen: true,
      onSelect: () => {
        const sort = { viewId: view.id, propertyId: property.id };
        context.dispatch(
          sortByProperty.create({
            ...sort,
            direction: "ascending",
            keepOthers: true,
          }),
        );
        goTo(context, "sort");
      },
    }));
  return {
    title: TEXT.newSort,
    back: view.sorts.length > 0 ? "sort" : null,
    search: TEXT.sortBy,
    items,
  };
}
