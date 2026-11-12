// A row shown as a card: its title and the values of the view's visible
// properties. Board and gallery views show their rows this way.
import { openRow } from "../../row-open.commands.ts";
import "./row-card.css";
import { html, nothing, type TemplateResult } from "lit-html";
import type { PropertyId, ViewId } from "../../../../model/index.ts";
import { type Dispatch } from "../../../../state/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import type { CellContext } from "../../property-definition.ts";
import { propertyType } from "../../property-registry.ts";
import type { CardPicture } from "./row-card.selectors.ts";
import type { TableColumn, TableRow } from "../../table-model.selectors.ts";

export interface RowCardOptions {
  readonly row: TableRow;
  readonly columns: readonly TableColumn[];
  readonly dispatch: Dispatch;
  // The view the card is in, which says how its row opens.
  readonly viewId: ViewId;
  // A property the layout already shows, such as a board's group.
  readonly omit?: PropertyId;
  // The picture shown above the title.
  readonly picture?: CardPicture | undefined;
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

function renderPicture(
  picture: CardPicture | undefined,
): TemplateResult | typeof nothing {
  if (picture === undefined) return nothing;
  if ("lines" in picture) {
    return html`<span class="row-card__preview" aria-hidden="true"
      >${picture.lines.map((line) => html`<span>${line}</span>`)}</span
    >`;
  }
  if ("preset" in picture) {
    return html`<span
      class="row-card__cover"
      data-cover=${picture.preset}
    ></span>`;
  }
  return html`<img class="row-card__cover" src=${picture.src} alt="" />`;
}

export function renderRowCard(options: RowCardOptions): TemplateResult {
  const { row, dispatch } = options;
  const title = row.title === "" ? COPY.sidebar.untitled : row.title;
  return html`<button
    type="button"
    class="row-card"
    data-row-id=${row.id}
    aria-description=${options.description ?? nothing}
    @click=${() => dispatch(openRow.create({ rowId: row.id, viewId: options.viewId }))}
    @keydown=${options.onKeyDown ?? nothing}
  >
    ${renderPicture(options.picture)}
    <span class="row-card__title" ?data-untitled=${row.title === ""}
      >${title}</span
    >
    <span class="row-card__values">${renderValues(options)}</span>
  </button>`;
}
