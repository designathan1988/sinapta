// An automation's "Add page to", as Notion's: the row under Do that names
// the database a page is added to, and the panel that chooses it among the
// workspace's databases, or none.
import {
  DATABASE_TYPE,
  isPageLike,
  selectIsInTrash,
  selectPageTitle,
} from "../../../blocks/page/index.ts";
import type { Automation } from "../../../blocks/database/index.ts";
import { COPY } from "../../../ui/copy.ts";
import type { MenuItem } from "../../../ui/menu/index.ts";
import { AUTOMATION_PANEL, setAutomation } from "../automation.commands.ts";
import type { TableContext } from "../table-cell.view.ts";
import { goTo, panelRow, type SettingsPanel } from "./settings-panel.ts";

export const ADD_PANEL = "automation-add:";
const TEXT = COPY.database;

function databasesOf(context: TableContext) {
  const { state } = context;
  return Object.values(state.workspace.blocks).flatMap((block) =>
    block.type === DATABASE_TYPE &&
    isPageLike(block) &&
    !selectIsInTrash(state, block)
      ? [{ id: block.id, title: selectPageTitle(block) || TEXT.untitled }]
      : [],
  );
}

export function addPageItem(
  context: TableContext,
  automation: Automation,
): MenuItem {
  const chosen = databasesOf(context).find(
    (database) => database.id === automation.addPageTo,
  );
  return panelRow(
    context,
    {
      label:
        chosen === undefined
          ? TEXT.addPageTo
          : TEXT.addPageToNamed(chosen.title),
      icon: chosen === undefined ? "plus" : "database",
    },
    `${ADD_PANEL}${automation.id}`,
  );
}

export function addPagePanel(
  context: TableContext,
  automation: Automation,
): SettingsPanel {
  const back = `${AUTOMATION_PANEL}${automation.id}`;
  const choose = (addPageTo: string) => () => {
    context.dispatch(
      setAutomation.create({
        databaseId: context.model.database.id,
        automationId: automation.id,
        patch: { addPageTo },
      }),
    );
    goTo(context, back);
  };
  const none: MenuItem = {
    label: TEXT.noDatabase,
    check: "radio",
    isChecked: automation.addPageTo === undefined,
    keepsOpen: true,
    onSelect: choose(""),
  };
  const databases = databasesOf(context).map((database): MenuItem => ({
    label: database.title,
    icon: "database",
    check: "radio",
    isChecked: database.id === automation.addPageTo,
    keepsOpen: true,
    onSelect: choose(database.id),
  }));
  return { title: TEXT.addPageTo, back, items: [none, ...databases] };
}
