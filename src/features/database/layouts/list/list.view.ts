// A list: one line per row, its page's icon and title, then the values of
// the view's visible properties; a grouped list shows its lines group by
// group.
import { withDefaultTemplate } from "../../template-default.commands.ts";
import { openRow } from "../../row-open.commands.ts";
import "./list.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { renamePage, selectPage } from "../../../../blocks/page/index.ts";
import { DEFAULT_LIST_OPTIONS } from "../../list-options.commands.ts";
import { selectRowColor } from "../../row-color.selectors.ts";
import { renderButton } from "../../../../ui/button/index.ts";
import { renderIcon } from "../../../../ui/icon/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { selectCellContext } from "../../cell-context.selectors.ts";
import { renderGroupSection } from "../../group-section.view.ts";
import { propertyType } from "../../property-registry.ts";
import { selectRowGroups } from "../../row-groups.selectors.ts";
import { addRow } from "../../row.commands.ts";
import type { TableContext } from "../../table-cell.view.ts";
import type { TableRow } from "../../table-model.selectors.ts";

function renderValues(row: TableRow, context: TableContext): TemplateResult[] {
  return context.model.columns.flatMap((column) => {
    if (column.isTitle) return [];
    const type = propertyType(column.property.type);
    const value = type.read(row.values[column.property.id]);
    if (value === undefined || value === false) return [];
    const cell = selectCellContext(context.state);
    const shown = type.renderCell(value, column.property, cell);
    return [html`<span>${shown}</span>`];
  });
}

function renderIconOf(row: TableRow, context: TableContext): TemplateResult {
  const icon = selectPage(context.state, row.id)?.props.icon ?? null;
  return html`<span class="list__icon" aria-hidden="true"
    >${icon ?? renderIcon("page")}</span
  >`;
}

// "Directly edit page name": the title is a field, renamed on Enter or
// when left, Escape putting the name back; "Open" opens the page.
function renderEditableLine(row: TableRow, context: TableContext) {
  const { dispatch } = context;
  const open = (): void => {
    dispatch(openRow.create({ rowId: row.id, viewId: context.model.view.id }));
  };
  const save = (field: HTMLInputElement): void => {
    if (field.value !== row.title)
      dispatch(renamePage.create({ pageId: row.id, title: field.value }));
  };
  const onKey = (event: KeyboardEvent): void => {
    const field = event.currentTarget;
    if (!(field instanceof HTMLInputElement)) return;
    if (event.key === "Enter") field.blur();
    if (event.key !== "Escape") return;
    event.stopPropagation();
    field.value = row.title;
    field.blur();
  };
  return html`<li>
    <div
      class="list__row"
      data-edit
      data-color=${selectRowColor(context.model, row, context.state) ?? nothing}
    >
      ${renderIconOf(row, context)}
      <input
        class="list__title-field"
        aria-label=${COPY.database.titleColumn}
        placeholder=${COPY.sidebar.untitled}
        .value=${row.title}
        @keydown=${onKey}
        @change=${(event: Event) => {
          if (event.target instanceof HTMLInputElement) save(event.target);
        }}
      />
      <span class="list__values">${renderValues(row, context)}</span>
      ${renderButton({ label: COPY.database.openPage, onClick: open })}
    </div>
  </li>`;
}

function renderLine(row: TableRow, context: TableContext): TemplateResult {
  if ((context.model.view.list ?? DEFAULT_LIST_OPTIONS).editTitle) {
    return renderEditableLine(row, context);
  }
  const title = row.title === "" ? COPY.sidebar.untitled : row.title;
  return html`<li>
    <button
      type="button"
      class="list__row"
      data-color=${selectRowColor(context.model, row, context.state) ?? nothing}
      @click=${() => context.dispatch(openRow.create({ rowId: row.id, viewId: context.model.view.id }))}
    >
      ${renderIconOf(row, context)}
      <span class="list__title" ?data-untitled=${row.title === ""}
        >${title}</span
      >
      <span class="list__values">${renderValues(row, context)}</span>
    </button>
  </li>`;
}

function renderLines(
  rows: readonly TableRow[],
  context: TableContext,
): TemplateResult {
  return html`<ul class="list__rows">
    ${repeat(
      rows,
      (row) => row.id,
      (row) => renderLine(row, context),
    )}
  </ul>`;
}

export function renderList(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const grouped = selectRowGroups(model);
  if (grouped !== undefined) {
    const content = (rows: readonly TableRow[]) => renderLines(rows, context);
    return html`<div class="list">
      ${grouped.groups
        .filter((group) => !group.isHidden)
        .map((group) =>
          renderGroupSection({ grouped, group, content }, context),
        )}
    </div>`;
  }
  const databaseId = model.database.id;
  return html`<div class="list">
    ${renderLines(model.rows, context)}
    ${renderButton({
      label: COPY.database.newCard,
      icon: "plus",
      onClick: () =>
        dispatch(
          addRow.create(
            withDefaultTemplate(context.state, {
              databaseId,
              opensPage: true,
              viewId: context.model.view.id,
            }),
          ),
        ),
    })}
  </div>`;
}
