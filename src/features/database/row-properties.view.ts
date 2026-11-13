// The property values of a database row, shown on the row's own page so
// they can be read and changed there as well as in the table.
import "./row-properties.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  selectDatabase,
  type PropertyDefinition,
} from "../../blocks/database/index.ts";
import { selectPage, type PageBlock } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { setRowValue } from "./row.commands.ts";
import type { RowPage } from "./row-files.view.ts";
import { propertyType } from "./property-registry.ts";
import { renderRowValue } from "./row-value.view.ts";
import { renderPropertyTypes } from "./column-menu.view.ts";
import { renderRowValueComments } from "./row-value-comments.view.ts";

// The property types, opened from a row page's "Add a property".
export const ROW_ADD_PROPERTY_OVERLAY = "row-add-property";

// One property as Notion's row page shows it: its type's icon and name,
// then its value.
function renderProperty(
  row: PageBlock,
  property: PropertyDefinition,
  page: RowPage,
): TemplateResult {
  const { icon } = propertyType(property.type);
  return html`<div
    class="database__row-property"
    data-property-id=${property.id}
  >
    <span class="database__row-name"
      >${renderIcon(icon)}<span>${property.name}</span></span
    >
    <div class="database__row-value">
      ${renderRowValue(row, property, page)}
    </div>
    ${renderRowValueComments(row, property, page)}
  </div>`;
}

type Control = HTMLInputElement | HTMLSelectElement;

// Stands for text that does not fit the property type.
const INVALID = Symbol("invalid");

// The value a changed control asks for.
function valueOf(control: Control, property: PropertyDefinition): unknown {
  if (control instanceof HTMLInputElement && control.type === "checkbox")
    return control.checked ? true : undefined;
  const value = propertyType(property.type).parse(control.value);
  return value === undefined && control.value.trim() !== "" ? INVALID : value;
}

interface RowContext {
  readonly row: PageBlock;
  readonly properties: readonly PropertyDefinition[];
  readonly dispatch: Dispatch;
}

function onChange(event: Event, context: RowContext): void {
  const control = event.target;
  const isControl =
    control instanceof HTMLInputElement || control instanceof HTMLSelectElement;
  if (!isControl) return;
  const holder = control.closest<HTMLElement>("[data-property-id]");
  const property = context.properties.find(
    (item) => item.id === holder?.dataset.propertyId,
  );
  if (property === undefined) return;
  const value = valueOf(control, property);
  control.toggleAttribute("aria-invalid", value === INVALID);
  if (value === INVALID) {
    announce(COPY.database.invalidValue);
    return;
  }
  const rowId = context.row.id;
  context.dispatch(
    setRowValue.create({ rowId, propertyId: property.id, value }),
  );
}

// Notion's "Add a property" under a row's properties: it opens the
// property types beside it, and the chosen one joins the database.
function renderAddProperty(
  row: PageBlock,
  databaseId: BlockId,
  page: RowPage,
): TemplateResult {
  const { state, dispatch } = page;
  const overlay = { kind: ROW_ADD_PROPERTY_OVERLAY, anchorId: row.id };
  const open = state.ui.overlay;
  const isOpen = open?.kind === overlay.kind && open.anchorId === row.id;
  const toggle = (): void => {
    dispatch(
      isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay }),
    );
  };
  return html`<button
      type="button"
      class="database__row-add"
      data-overlay-anchor
      aria-haspopup="menu"
      aria-expanded=${String(isOpen)}
      @click=${toggle}
    >
      ${renderIcon("plus")}<span>${COPY.database.addAProperty}</span>
    </button>
    ${isOpen ? renderPropertyTypes(databaseId, dispatch) : nothing}`;
}

export function renderRowProperties(
  state: AppState,
  dispatch: Dispatch,
  pageId: BlockId | null = state.ui.activePageId,
): TemplateResult | typeof nothing {
  const row = selectPage(state, pageId);
  const database = selectDatabase(state, row?.parentId ?? null);
  const properties = database?.props.properties ?? [];
  if (row === undefined || database === undefined || properties.length === 0)
    return nothing;
  return html`<div
    class="database__row-properties"
    role="group"
    aria-label=${COPY.database.properties}
    @change=${(event: Event) => {
      onChange(event, { row, properties, dispatch });
    }}
  >
    ${properties.map((property) =>
      renderProperty(row, property, { state, dispatch }),
    )}
    ${renderAddProperty(row, database.id, { state, dispatch })}
  </div>`;
}
