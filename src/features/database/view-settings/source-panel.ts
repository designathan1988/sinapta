// The view settings' "Data source settings", as Notion's: Source, the
// database the view reads (a linked view may choose another), Edit
// properties, AI Autofill, and Lock database.
import { setPageLocked } from "../../../blocks/page/index.ts";
import { COPY } from "../../../ui/copy.ts";
import type { MenuEntry } from "../../../ui/menu/index.ts";
import { setLinkedViewSource } from "../linked-view.commands.ts";
import type { TableContext } from "../table-cell.view.ts";
import { sourceChoices } from "../view-tab-source.ts";
import { choiceItems, panelRow, type SettingsPanel } from "./settings-panel.ts";

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

export function sourceRows(context: TableContext): MenuEntry[] {
  const { model, dispatch } = context;
  const name = model.database.props.title.map((span) => span.text).join("");
  const block = context.state.workspace.blocks[model.database.id];
  const isLocked = block?.props.isLocked === true;
  const pageId = model.database.id;
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
    panelRow(
      context,
      { label: COPY.ai.autofill, icon: "sparkles" },
      "ai-autofill",
    ),
    {
      label: COPY.pageMenu.lockDatabase,
      icon: "lock",
      check: "switch",
      isChecked: isLocked,
      onSelect: () =>
        dispatch(setPageLocked.create({ pageId, isLocked: !isLocked })),
    },
  ];
}
