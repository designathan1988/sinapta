// The rows of a group's menu, as Notion's, for a table's group and a
// board's column alike: Hide, and for a group an option names, the
// option's name over them, Delete and the option's colors.
import type { TemplateResult } from "lit-html";
import { COPY } from "../../ui/copy.ts";
import type { MenuEntry } from "../../ui/menu/index.ts";
import { toggleGroupHidden } from "./group.commands.ts";
import { optionColorItems, renderOptionName } from "./option-menu-parts.ts";
import { deleteOption } from "./option.commands.ts";
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

export interface GroupMenuParts {
  readonly lead?: TemplateResult;
  readonly items: MenuEntry[];
}

export function groupMenuParts(
  context: TableContext,
  key: string,
): GroupMenuParts {
  const viewId = context.model.view.id;
  const hide: MenuEntry = {
    label: TEXT.hideGroup,
    icon: "eye-off",
    onSelect: () => context.dispatch(toggleGroupHidden.create({ viewId, key })),
  };
  const named = groupOption(context, key);
  if (named === undefined) return { items: [hide] };
  return {
    lead: renderOptionName(named.target, named.option.name, context),
    items: [
      hide,
      {
        label: TEXT.deleteOption,
        icon: "trash",
        isDanger: true,
        onSelect: () => context.dispatch(deleteOption.create(named.target)),
      },
      { kind: "divider" },
      ...optionColorItems(named.target, named.option.color, context),
    ],
  };
}
