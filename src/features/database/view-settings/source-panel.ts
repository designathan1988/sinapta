// The view settings' "Data source settings", as Notion's: Source, the
// data source the view reads (one of its database's linked sources, or
// for a linked view any database), Edit properties, Automations, AI
// Autofill, Turn into, Linked events, Manage data sources, and Lock
// database.
import { selectDatabase } from "../../../blocks/database/index.ts";
import { selectPageTitle, setPageLocked } from "../../../blocks/page/index.ts";
import type { BlockId } from "../../../model/index.ts";
import { setViewSource } from "../data-source.commands.ts";
import { COPY } from "../../../ui/copy.ts";
import type { MenuEntry } from "../../../ui/menu/index.ts";
import { setLinkedViewSource } from "../linked-view.commands.ts";
import type { TableContext } from "../table-cell.view.ts";
import { sourceChoices } from "../view-tab-source.ts";
import { choiceItems, panelRow, type SettingsPanel } from "./settings-panel.ts";
import { automationsRow } from "./automations-panel.ts";
import { turnIntoRow } from "./turn-into-panel.ts";
import { linkedEventsRow } from "./linked-events-panel.ts";
import { dataSourcesRow, linkedSources } from "./data-sources-panel.ts";

const TEXT = COPY.database;

// A database's own view chooses among the database and its linked data
// sources; a linked view, among the workspace's databases.
function choicesOf(context: TableContext) {
  const own = selectDatabase(context.state, context.model.holderId);
  const databases =
    own === undefined
      ? sourceChoices(context.state, context)
      : [own, ...linkedSources(context)].map((database) => ({
          id: database.id,
          title: selectPageTitle(database),
        }));
  return databases.map((choice) => ({
    value: choice.id,
    label: choice.title === "" ? TEXT.untitled : choice.title,
    icon: "database" as const,
  }));
}

export function sourcePanel(context: TableContext): SettingsPanel {
  const { state, model, dispatch } = context;
  const own = selectDatabase(state, model.holderId);
  const choose = (databaseId: BlockId): void => {
    if (databaseId === model.database.id) return;
    if (own === undefined) {
      const blockId = model.holderId;
      dispatch(setLinkedViewSource.create({ blockId, databaseId }));
      return;
    }
    const sourceId = databaseId === own.id ? null : databaseId;
    dispatch(setViewSource.create({ viewId: model.view.id, sourceId }));
  };
  return {
    title: TEXT.viewSource,
    back: null,
    items: choiceItems(context, {
      choices: choicesOf(context),
      value: model.database.id,
      back: null,
      choose,
    }),
  };
}

// Lock database: its properties and views stay as they are while on.
function lockRow(context: TableContext): MenuEntry {
  const pageId = context.model.database.id;
  const block = context.state.workspace.blocks[pageId];
  const isLocked = block?.props.isLocked === true;
  return {
    label: COPY.pageMenu.lockDatabase,
    icon: "lock",
    check: "switch",
    isChecked: isLocked,
    onSelect: () =>
      context.dispatch(setPageLocked.create({ pageId, isLocked: !isLocked })),
  };
}

export function sourceRows(context: TableContext): MenuEntry[] {
  const name = context.model.database.props.title
    .map((span) => span.text)
    .join("");
  return [
    { kind: "divider" },
    { kind: "section", label: TEXT.dataSourceSettings },
    panelRow(
      context,
      {
        label: TEXT.viewSource,
        icon: "source",
        value: name === "" ? TEXT.untitled : name,
      },
      "source",
    ),
    panelRow(
      context,
      { label: TEXT.editProperties, icon: "list" },
      "properties",
    ),
    automationsRow(context),
    panelRow(
      context,
      { label: COPY.ai.autofill, icon: "sparkles" },
      "ai-autofill",
    ),
    turnIntoRow(context),
    linkedEventsRow(context),
    dataSourcesRow(context),
    lockRow(context),
  ];
}
