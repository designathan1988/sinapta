// The view settings' "Turn into", as Notion's: Turn into Tasks database
// and Turn into Meetings database, each adding that kind's properties the
// database lacks; offered while it lacks any.
import { html } from "lit-html";
import { COPY } from "../../../ui/copy.ts";
import type { MenuEntry } from "../../../ui/menu/index.ts";
import type { TableContext } from "../table-cell.view.ts";
import {
  missingProperties,
  turnIntoTasks,
  type DatabaseKind,
} from "../task-database.commands.ts";
import { goTo, panelRow, type SettingsPanel } from "./settings-panel.ts";

const TEXT = COPY.database;

function turnIntoItem(context: TableContext, kind: DatabaseKind): MenuEntry[] {
  const { model, dispatch } = context;
  const add = missingProperties(model.database, kind);
  if (add.length === 0) return [];
  const databaseId = model.database.id;
  return [
    {
      label: kind === "tasks" ? TEXT.turnIntoTasks : TEXT.turnIntoMeetings,
      icon: kind === "tasks" ? "check" : "calendar",
      keepsOpen: true,
      onSelect: () => {
        dispatch(turnIntoTasks.create({ databaseId, add: [...add] }));
        goTo(context, null);
      },
    },
  ];
}

export function turnIntoPanel(context: TableContext): SettingsPanel {
  const items = [
    ...turnIntoItem(context, "tasks"),
    ...turnIntoItem(context, "meetings"),
  ];
  const note =
    items.length === 0 ? TEXT.isTaskDatabase : TEXT.turnIntoTasksNote;
  return {
    title: TEXT.turnInto,
    back: null,
    lead: html`<p class="view-settings__note" data-lead>${note}</p>`,
    items,
  };
}

export function turnIntoRow(context: TableContext): MenuEntry {
  return panelRow(context, { label: TEXT.turnInto, icon: "swap" }, "turn-into");
}
