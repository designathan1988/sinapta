// An automation's "Send webhook", as Notion's: the row under Do, and the
// panel with the address the page is posted to (by the workspace's
// server), and Remove webhook. The browser's own workspace has no server
// to send it, which the panel says.
import { html } from "lit-html";
import type { Automation } from "../../../blocks/database/index.ts";
import { COPY } from "../../../ui/copy.ts";
import { renderMenuName, type MenuEntry } from "../../../ui/menu/index.ts";
import { AUTOMATION_PANEL, setAutomation } from "../automation.commands.ts";
import type { TableContext } from "../table-cell.view.ts";
import { goTo, panelRow, type SettingsPanel } from "./settings-panel.ts";

export const HOOK_PANEL = "automation-hook:";
const TEXT = COPY.database;

export function webhookItem(
  context: TableContext,
  automation: Automation,
): MenuEntry {
  const url = automation.webhookUrl ?? "";
  return panelRow(
    context,
    {
      label: url === "" ? TEXT.sendWebhook : TEXT.sendWebhookTo(url),
      icon: url === "" ? "plus" : "link",
    },
    `${HOOK_PANEL}${automation.id}`,
  );
}

export function webhookPanel(
  context: TableContext,
  automation: Automation,
): SettingsPanel {
  const back = `${AUTOMATION_PANEL}${automation.id}`;
  const set = (webhookUrl: string): void => {
    context.dispatch(
      setAutomation.create({
        databaseId: context.model.database.id,
        automationId: automation.id,
        patch: { webhookUrl },
      }),
    );
  };
  const isServer = context.state.persistence.sync.workspaceId !== null;
  const lead = html`${renderMenuName({
      icon: "link",
      label: TEXT.webhookUrl,
      value: automation.webhookUrl ?? "",
      onRename: set,
    })}
    <p class="view-settings__note" data-lead>
      ${isServer ? TEXT.webhookNote : TEXT.webhookNeedsServer}
    </p>`;
  const remove: MenuEntry = {
    label: TEXT.removeWebhook,
    icon: "trash",
    isDanger: true,
    keepsOpen: true,
    onSelect: () => {
      set("");
      goTo(context, back);
    },
  };
  const items = automation.webhookUrl === undefined ? [] : [remove];
  return { title: TEXT.sendWebhook, back, lead, items };
}
