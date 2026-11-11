// A row shown as a card: its title and the values of the view's visible
// properties. Board and gallery views show their rows this way.
import "./row-card.css";
import { html, nothing, type TemplateResult } from "lit-html";
import type { PropertyId } from "../../../../model/index.ts";
import { setActivePage, type Dispatch } from "../../../../state/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import type { CellContext } from "../../property-definition.ts";
import { propertyType } from "../../property-registry.ts";
import type { TableColumn, TableRow } from "../../table-model.selectors.ts";

export interface RowCardOptions {
  readonly row: TableRow;
  readonly columns: readonly TableColumn[];
  readonly dispatch: Dispatch;
  // A property the layout already shows, such as a board's group.
  readonly omit?: PropertyId;
  // An image address shown above the title.
  readonly cover?: string | undefined;
  readonly onKeyDown?: (event: KeyboardEvent) => void;
  readonly description?: string;
  // The addresses of kept files, for values that show them.
  readonly cell?: CellContext;
}

function renderValues(options: RowCardOptions): TemplateResult[] {
  return options.columns.flatMap((column) => {
    const { property } = column;
    if (column.isTitle || property.id === options.omit) return [];
    const type = propertyType(property.type);
    const value = type.read(options.row.values[property.id]);
    if (value === undefined || value === false) return [];
    return [
      html`<span class="row-card__value" title=${property.name}
        >${type.renderCell(value, property, options.cell)}</span
      >`,
    ];
  });
}

export function renderRowCard(options: RowCardOptions): TemplateResult {
  const { row, dispatch } = options;
  const title = row.title === "" ? COPY.sidebar.untitled : row.title;
  return html`<button
    type="button"
    class="row-card"
    data-row-id=${row.id}
    aria-description=${options.description ?? nothing}
    @click=${() => dispatch(setActivePage.create({ pageId: row.id }))}
    @keydown=${options.onKeyDown ?? nothing}
  >
    ${
      options.cover === undefined
        ? nothing
        : html`<img class="row-card__cover" src=${options.cover} alt="" />`
    }
    <span class="row-card__title" ?data-untitled=${row.title === ""}
      >${title}</span
    >
    <span class="row-card__values">${renderValues(options)}</span>
  </button>`;
}
