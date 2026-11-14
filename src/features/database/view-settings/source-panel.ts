// The view settings' "Data source settings", as Notion's: Source, the
// database the view reads (a linked view may choose another), Edit
// properties, Automations, AI Autofill, Turn into, Linked events, and
// Lock database.
import { setPageLocked } from "../../../blocks/page/index.ts";
import { COPY } from "../../../ui/copy.ts";
import type { MenuEntry } from "../../../ui/menu/index.ts";
import { setLinkedViewSource } from "../linked-view.commands.ts";
import type { TableContext } from "../table-cell.view.ts";
import { sourceChoices } from "../view-tab-source.ts";
import { choiceItems, panelRow, type SettingsPanel } from "./settings-panel.ts";
import { automationsRow } from "./automations-panel.ts";
import { turnIntoRow } from "./turn-into-panel.ts";
import { linkedEventsRow } from "./linked-events-panel.ts";

const TEXT = COPY.database;

export function sourcePanel(context: TableContext): SettingsPanel {
  const { state, model, dispatch } = context;
  const choices = sourceChoices(state, context).map((choice) => ({
    value: choice.id,
    label: choice.title === "" ? TEXT.untitled : choice.title,
    icon: "database" as const,
  }));
  return {
    title: TEXT.viewSource,
    back: null,
    items: choiceItems(context, {
      choices,
      value: model.database.id,
      back: null,
      choose: (databaseId) => {
        if (databaseId === model.database.id) return;
        const blockId = model.holderId;
        dispatch(setLinkedViewSource.create({ blockId, databaseId }));
      },
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
    lockRow(context),
  ];
}
