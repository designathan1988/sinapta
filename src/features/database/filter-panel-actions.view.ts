// The foot of the advanced filter, as Notion's: "Add filter rule" with a
// list to add a rule or a group of rules, then "Delete filter", which
// takes the whole filter away.
import { html, type TemplateResult } from "lit-html";
import { closeOverlay } from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderSelect } from "../../ui/select/index.ts";
import { addFilter, addGroup } from "./filter-edit.ts";
import { newFilter } from "./filter-fields.ts";
import type { TableContext } from "./table-cell.view.ts";
import { setViewFilter } from "./view.commands.ts";

export const ADD_RULE_ID = "filter-add";

function renderAdd(context: TableContext): TemplateResult {
  const { model, state, dispatch } = context;
  const add = (isGroup: boolean) => (): void => {
    const filter = newFilter(context);
    if (filter === undefined) return;
    const top = model.view.filter;
    const next = isGroup ? addGroup(top, filter) : addFilter(top, [], filter);
    dispatch(setViewFilter.create({ viewId: model.view.id, filter: next }));
  };
  return renderSelect(
    {
      id: ADD_RULE_ID,
      label: COPY.database.addFilterRule,
      value: undefined,
      variant: "quiet",
      display: html`${renderIcon("plus")} ${COPY.database.addFilterRule}`,
      options: [],
      onChoose: () => undefined,
      menu: {
        items: [
          {
            label: COPY.database.addFilterRule,
            icon: "plus",
            onSelect: add(false),
          },
          {
            label: COPY.database.addFilterGroup,
            description: COPY.database.filterGroupHint,
            icon: "group",
            onSelect: add(true),
          },
        ],
      },
    },
    { overlay: state.ui.overlay, dispatch },
  );
}

export function renderFilterActions(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const deleteAll = (): void => {
    const filter = { conjunction: "and" as const, items: [] };
    dispatch(setViewFilter.create({ viewId: model.view.id, filter }));
    dispatch(closeOverlay.create({}));
  };
  return html`<div class="database__filter-actions">${renderAdd(context)}</div>
    <hr class="database__filter-rule" />
    <div class="database__filter-foot">
      ${renderButton({
        label: COPY.database.deleteFilter,
        icon: "trash",
        onClick: deleteAll,
      })}
    </div>`;
}
