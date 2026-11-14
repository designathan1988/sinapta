// The view settings' "Manage data sources", as Notion's: under Source the
// database itself and each source linked to it, with how many views show
// it, then Add data source; under Linked, Link existing data source. A
// linked source opens its own panel ("data-source:<id>": Open, Unlink).
import {
  selectDatabase,
  type DatabaseBlock,
} from "../../../blocks/database/index.ts";
import {
  selectIsInTrash,
  selectPageTitle,
} from "../../../blocks/page/index.ts";
import type { BlockId } from "../../../model/index.ts";
import { setActivePage } from "../../../state/index.ts";
import { COPY } from "../../../ui/copy.ts";
import type { MenuEntry } from "../../../ui/menu/index.ts";
import {
  addDataSource,
  linkDataSource,
  unlinkDataSource,
} from "../data-source.commands.ts";
import type { TableContext } from "../table-cell.view.ts";
import { selectViewHolder } from "../view-holder.selectors.ts";
import { goTo, panelRow, type SettingsPanel } from "./settings-panel.ts";

const TEXT = COPY.database;
export const SOURCE_PANEL = "data-source:";

// The database that holds the views: the container of the sources.
export function holderDatabase(context: TableContext): DatabaseBlock {
  const holder = selectViewHolder(context.state, context.model.holderId);
  return holder?.database ?? context.model.database;
}

function nameOf(database: DatabaseBlock): string {
  const title = selectPageTitle(database);
  return title === "" ? TEXT.untitled : title;
}

// How many of the container's views show a source (null: its own rows).
function viewsShowing(context: TableContext, sourceId: BlockId | null) {
  const own = holderDatabase(context);
  const linked = new Set(own.props.sourceIds ?? []);
  return own.props.viewIds.filter((viewId) => {
    const chosen = context.state.workspace.views[viewId]?.sourceId;
    // A source no longer linked shows the database's own rows.
    const shown = chosen !== undefined && linked.has(chosen) ? chosen : null;
    return shown === sourceId;
  }).length;
}

export function linkedSources(context: TableContext): DatabaseBlock[] {
  const own = holderDatabase(context);
  return (own.props.sourceIds ?? []).flatMap((id) => {
    const source = selectDatabase(context.state, id);
    return source === undefined ? [] : [source];
  });
}

export function dataSourcesPanel(context: TableContext): SettingsPanel {
  const own = holderDatabase(context);
  const linked = linkedSources(context).map((source) =>
    panelRow(
      context,
      {
        label: nameOf(source),
        icon: "database",
        value: TEXT.viewCount(viewsShowing(context, source.id)),
      },
      `${SOURCE_PANEL}${source.id}`,
    ),
  );
  const items: MenuEntry[] = [
    { kind: "section", label: TEXT.viewSource },
    {
      label: nameOf(own),
      icon: "database",
      value: TEXT.viewCount(viewsShowing(context, null)),
      onSelect: () => undefined,
    },
    ...linked,
    {
      label: TEXT.addDataSource,
      icon: "plus",
      keepsOpen: true,
      onSelect: () =>
        context.dispatch(addDataSource.create({ databaseId: own.id })),
    },
    { kind: "divider" },
    { kind: "section", label: TEXT.linkedSources },
    panelRow(
      context,
      { label: TEXT.linkExistingSource, icon: "plus" },
      "link-source",
    ),
  ];
  return { title: TEXT.manageDataSources, back: null, items };
}

// The workspace's other databases, outside the trash and not yet linked.
export function linkSourcePanel(context: TableContext): SettingsPanel {
  const own = holderDatabase(context);
  const linked = new Set(own.props.sourceIds ?? []);
  const { state, dispatch } = context;
  const choices = Object.values(state.workspace.blocks).flatMap((block) => {
    const database = selectDatabase(state, block.id);
    if (database === undefined || database.id === own.id) return [];
    if (linked.has(database.id) || selectIsInTrash(state, database)) return [];
    return [database];
  });
  const items: MenuEntry[] = choices.map((database) => ({
    label: nameOf(database),
    icon: "database",
    keepsOpen: true,
    onSelect: () => {
      dispatch(
        linkDataSource.create({ databaseId: own.id, sourceId: database.id }),
      );
      goTo(context, "data-sources");
    },
  }));
  return {
    title: TEXT.linkExistingSource,
    back: "data-sources",
    search: TEXT.searchProperty,
    items:
      items.length === 0
        ? [{ kind: "note", label: TEXT.noOtherDatabases }]
        : items,
  };
}

// One linked source: open it, or unlink it.
export function dataSourcePanelOf(
  context: TableContext,
  name: string,
): SettingsPanel | undefined {
  if (!name.startsWith(SOURCE_PANEL)) return undefined;
  const id = name.slice(SOURCE_PANEL.length);
  const source = linkedSources(context).find((item) => item.id === id);
  if (source === undefined) return undefined;
  const own = holderDatabase(context);
  const { dispatch } = context;
  const items: MenuEntry[] = [
    {
      label: TEXT.openSource,
      icon: "arrow-up-right",
      onSelect: () => dispatch(setActivePage.create({ pageId: source.id })),
    },
    {
      label: TEXT.unlinkSource,
      icon: "trash",
      isDanger: true,
      keepsOpen: true,
      onSelect: () => {
        dispatch(
          unlinkDataSource.create({ databaseId: own.id, sourceId: source.id }),
        );
        goTo(context, "data-sources");
      },
    },
  ];
  return { title: nameOf(source), back: "data-sources", items };
}

export function dataSourcesRow(context: TableContext): MenuEntry {
  return panelRow(
    context,
    { label: TEXT.manageDataSources, icon: "database" },
    "data-sources",
  );
}
