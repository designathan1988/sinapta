// The view settings' "Automations", as Notion's: on the Free plan a card
// that says what they do, with "Upgrade now"; on a paid plan, or in the
// browser's own workspace, the database's automations, each opening its
// editor, and "New automation".
import "./automations.css";
import { html, type TemplateResult } from "lit-html";
import type { Automation } from "../../../blocks/database/index.ts";
import { openOverlay, selectPlanLimits } from "../../../state/index.ts";
import { COPY } from "../../../ui/copy.ts";
import { renderIcon } from "../../../ui/icon/index.ts";
import type { MenuEntry } from "../../../ui/menu/index.ts";
import { SETTINGS_OVERLAY_KIND } from "../../../ui/shortcuts/index.ts";
import { addAutomation, AUTOMATION_PANEL } from "../automation.commands.ts";
import type { TableContext } from "../table-cell.view.ts";
import { automationSummary } from "./automation-words.ts";
import { panelRow, type SettingsPanel } from "./settings-panel.ts";

const TEXT = COPY.database;

function renderUpgrade(context: TableContext): TemplateResult {
  const overlay = { kind: SETTINGS_OVERLAY_KIND, anchorId: "plans" };
  return html`<div class="view-settings__upsell">
    <span class="view-settings__upsell-icon">${renderIcon("bolt")}</span>
    <p class="view-settings__upsell-title">${TEXT.automations}</p>
    <p class="view-settings__note">${TEXT.automationsPitch}</p>
    <button
      type="button"
      class="button view-settings__upgrade"
      data-variant="outline"
      data-autofocus
      @click=${() => context.dispatch(openOverlay.create({ overlay }))}
    >
      <span class="view-settings__upgrade-icon">${renderIcon("up")}</span>
      ${TEXT.upgradeNow}
    </button>
  </div>`;
}

function automationRow(
  context: TableContext,
  automation: Automation,
): MenuEntry {
  const { label, value } = automationSummary(context, automation);
  return panelRow(
    context,
    { label, icon: "bolt", value },
    `${AUTOMATION_PANEL}${automation.id}`,
  );
}

export function automationsPanel(context: TableContext): SettingsPanel {
  const { state, model, dispatch } = context;
  if (selectPlanLimits(state)?.automations === false)
    return {
      title: TEXT.automations,
      back: null,
      items: [],
      lead: renderUpgrade(context),
    };
  const automations = model.database.props.automations ?? [];
  const databaseId = model.database.id;
  return {
    title: TEXT.automations,
    back: null,
    lead: html`<p class="view-settings__note" data-lead>
      ${TEXT.automationsPitch}
    </p>`,
    items: [
      ...automations.map((automation) => automationRow(context, automation)),
      {
        label: TEXT.newAutomation,
        icon: "plus",
        keepsOpen: true,
        onSelect: () => dispatch(addAutomation.create({ databaseId })),
      },
    ],
  };
}

// The row that opens them, with how many are on.
export function automationsRow(context: TableContext): MenuEntry {
  const automations = context.model.database.props.automations ?? [];
  const active = automations.filter((item) => item.isActive).length;
  return panelRow(
    context,
    {
      label: TEXT.automations,
      icon: "bolt",
      ...(active > 0 && { value: String(active) }),
    },
    "automations",
  );
}
