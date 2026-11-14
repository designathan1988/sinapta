// An automation's "Send notification to", as Notion's: the row under Do,
// and the panel of the workspace's people, each switched on or off; the
// people chosen find a notice in their inbox each time it runs. The
// browser's own workspace has no people to tell, which the panel says.
import { html } from "lit-html";
import type { Automation } from "../../../blocks/database/index.ts";
import { COPY } from "../../../ui/copy.ts";
import type { MenuEntry } from "../../../ui/menu/index.ts";
import { AUTOMATION_PANEL, setAutomation } from "../automation.commands.ts";
import type { TableContext } from "../table-cell.view.ts";
import { panelRow, type SettingsPanel } from "./settings-panel.ts";

export const NOTIFY_PANEL = "automation-notify:";
const TEXT = COPY.database;

export function notifyItem(
  context: TableContext,
  automation: Automation,
): MenuEntry {
  const count = automation.notifyUserIds?.length ?? 0;
  return panelRow(
    context,
    {
      label: TEXT.sendNotification,
      icon: count === 0 ? "plus" : "person",
      ...(count > 0 && { value: String(count) }),
    },
    `${NOTIFY_PANEL}${automation.id}`,
  );
}

export function notifyPanel(
  context: TableContext,
  automation: Automation,
): SettingsPanel {
  const { members, workspaceId } = context.state.persistence.sync;
  const chosen = new Set(automation.notifyUserIds ?? []);
  const toggle = (userId: string) => () => {
    const next = chosen.has(userId)
      ? [...chosen].filter((id) => id !== userId)
      : [...chosen, userId];
    context.dispatch(
      setAutomation.create({
        databaseId: context.model.database.id,
        automationId: automation.id,
        patch: { notifyUserIds: next },
      }),
    );
  };
  const people = members.map((member): MenuEntry => ({
    label: member.name === "" ? member.email : member.name,
    icon: "person",
    check: "switch",
    isChecked: chosen.has(member.id),
    keepsOpen: true,
    onSelect: toggle(member.id),
  }));
  const note = workspaceId === null ? TEXT.notifyNeedsServer : TEXT.notifyNote;
  return {
    title: TEXT.sendNotification,
    back: `${AUTOMATION_PANEL}${automation.id}`,
    lead: html`<p class="view-settings__note" data-lead>${note}</p>`,
    items: workspaceId === null ? [] : people,
  };
}
