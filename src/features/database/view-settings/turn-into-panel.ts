// The view settings' "Turn into", as Notion's: Turn into Tasks database,
// which adds Assignee, Status and Due date where the database lacks them;
// a database that has all three is a Tasks database already.
import { html } from "lit-html";
import { COPY } from "../../../ui/copy.ts";
import type { MenuEntry } from "../../../ui/menu/index.ts";
import type { TableContext } from "../table-cell.view.ts";
import {
  missingTaskProperties,
  turnIntoTasks,
} from "../task-database.commands.ts";
import { goTo, panelRow, type SettingsPanel } from "./settings-panel.ts";

const TEXT = COPY.database;

export function turnIntoPanel(context: TableContext): SettingsPanel {
  const { model, dispatch } = context;
  const add = missingTaskProperties(model.database);
  const databaseId = model.database.id;
  const items: MenuEntry[] =
    add.length === 0
      ? []
      : [
          {
            label: TEXT.turnIntoTasks,
            icon: "check",
            keepsOpen: true,
            onSelect: () => {
              dispatch(turnIntoTasks.create({ databaseId, add: [...add] }));
              goTo(context, null);
            },
          },
        ];
  const note = add.length === 0 ? TEXT.isTaskDatabase : TEXT.turnIntoTasksNote;
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
