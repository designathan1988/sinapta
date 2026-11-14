// The panels of an automation, named by it: "automation:<id>" (its
// editor), "automation-when:<id>", "automation-set:<id>" to choose a
// property, "automation-value:<id>:<property>" to choose its value,
// "automation-add:<id>", "automation-hook:<id>" and "automation-notify:<id>".
import type { Automation } from "../../../blocks/database/index.ts";
import { AUTOMATION_PANEL } from "../automation.commands.ts";
import type { TableContext } from "../table-cell.view.ts";
import { ADD_PANEL, addPagePanel } from "./automation-add-panel.ts";
import {
  editPanel,
  SET_PANEL,
  setPanel,
  VALUE_PANEL,
  valuePanel,
  WHEN_PANEL,
  whenPanel,
} from "./automation-edit-panel.ts";
import { HOOK_PANEL, webhookPanel } from "./automation-hook-panel.ts";
import { NOTIFY_PANEL, notifyPanel } from "./automation-notify-panel.ts";
import type { SettingsPanel } from "./settings-panel.ts";

type Build = (context: TableContext, automation: Automation) => SettingsPanel;

// The panels named by an automation alone, by their names' start.
const PANELS_OF: Readonly<Record<string, Build>> = {
  [AUTOMATION_PANEL]: editPanel,
  [SET_PANEL]: setPanel,
  [WHEN_PANEL]: whenPanel,
  [ADD_PANEL]: addPagePanel,
  [HOOK_PANEL]: webhookPanel,
  [NOTIFY_PANEL]: notifyPanel,
};

// The panel a name stands for, when it names one of an automation's.
export function automationPanelOf(
  context: TableContext,
  name: string,
): SettingsPanel | undefined {
  const [kind = "", id = "", propertyId = ""] = name.split(":");
  const automation = context.model.database.props.automations?.find(
    (item) => item.id === id,
  );
  if (automation === undefined) return undefined;
  const build = PANELS_OF[`${kind}:`];
  if (build !== undefined) return build(context, automation);
  const property = context.model.database.props.properties.find(
    (item) => item.id === propertyId,
  );
  if (`${kind}:` !== VALUE_PANEL || property === undefined) return undefined;
  return valuePanel(context, automation, property);
}
