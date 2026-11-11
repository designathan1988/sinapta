// The menu of a group of rows in a table or list, opened from the "…" on
// its header, as Notion's: hiding the group, and for a group an option
// names, the option's name, Delete and its colors.
import { nothing, type TemplateResult } from "lit-html";
import { closeOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderMenu, type MenuEntry } from "../../ui/menu/index.ts";
import { groupKeyOf } from "./group-actions.ts";
import { toggleGroupHidden } from "./group.commands.ts";
import { optionColorItems, renderOptionName } from "./option-menu-parts.ts";
import { deleteOption } from "./option.commands.ts";
import { selectRowGroups } from "./row-groups.selectors.ts";
import type { TableContext } from "./table-cell.view.ts";

const TEXT = COPY.database;

// The option a group stands for, when its view groups by options.
function groupOption(context: TableContext, key: string) {
  const { model } = context;
  const propertyId = model.view.groupBy?.propertyId;
  const property = model.database.props.properties.find(
    (item) => item.id === propertyId,
  );
  const option = property?.options?.find((item) => item.id === key);
  if (property === undefined || option === undefined) return undefined;
  const target = {
    databaseId: model.database.id,
    propertyId: property.id,
    optionId: option.id,
  };
  return { option, target };
}

export function renderGroupMenu(
  context: TableContext,
): TemplateResult | typeof nothing {
  const { model, state, dispatch } = context;
  const key = groupKeyOf(model.holderId, state.ui.overlay?.anchorId ?? "");
  const group = selectRowGroups(model)?.groups.find((one) => one.key === key);
  if (key === undefined || group === undefined) return nothing;
  const viewId = model.view.id;
  const hide: MenuEntry = {
    label: TEXT.hideGroup,
    icon: "eye-off",
    onSelect: () => dispatch(toggleGroupHidden.create({ viewId, key })),
  };
  const named = groupOption(context, key);
  const optionItems: MenuEntry[] =
    named === undefined
      ? []
      : [
          {
            label: TEXT.deleteOption,
            icon: "trash",
            isDanger: true,
            onSelect: () => dispatch(deleteOption.create(named.target)),
          },
          { kind: "divider" },
          ...optionColorItems(named.target, named.option.color, context),
        ];
  return renderMenu({
    label: TEXT.groupActions(group.label),
    ...(named !== undefined && {
      lead: renderOptionName(named.target, named.option.name, context),
    }),
    items: [hide, ...optionItems],
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
