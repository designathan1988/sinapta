// One automation in the view settings, as Notion's editor: When (Page
// added, or a property edited, chosen in a list of its own), Do (Edit property: the values a page is
// given), Active, and Delete automation. Its panels are named by the
// automation: "automation:<id>", "automation-set:<id>" to choose a
// property, "automation-value:<id>:<property>" to choose its value.
import type {
  Automation,
  PropertyDefinition,
} from "../../../blocks/database/index.ts";
import { COPY } from "../../../ui/copy.ts";
import type { MenuEntry, MenuItem } from "../../../ui/menu/index.ts";
import {
  AUTOMATION_PANEL,
  deleteAutomation,
  setAutomation,
} from "../automation.commands.ts";
import type { TableContext } from "../table-cell.view.ts";
import { actionWords, triggerWords, valueWords } from "./automation-words.ts";
import {
  ADD_PANEL,
  addPageItem,
  addPagePanel,
} from "./automation-add-panel.ts";
import {
  HOOK_PANEL,
  webhookItem,
  webhookPanel,
} from "./automation-hook-panel.ts";
import { goTo, panelRow, type SettingsPanel } from "./settings-panel.ts";

const TEXT = COPY.database;
const SET_PANEL = "automation-set:";
const WHEN_PANEL = "automation-when:";
const VALUE_PANEL = "automation-value:";
// What an automation can set, as Notion's Edit property offers first.
const SETTABLE = new Set([
  "select",
  "status",
  "multi-select",
  "checkbox",
  "date",
]);
// What cannot be edited by hand, so never sets one off.
const COMPUTED = new Set([
  "formula",
  "rollup",
  "created-time",
  "created-by",
  "last-edited-time",
  "last-edited-by",
  "button",
  "unique-id",
]);

function automationOf(context: TableContext, id: string) {
  return context.model.database.props.automations?.find(
    (item) => item.id === id,
  );
}

function change(
  context: TableContext,
  automation: Automation,
  patch: Partial<Omit<Automation, "id">>,
): void {
  const databaseId = context.model.database.id;
  const automationId = automation.id;
  context.dispatch(setAutomation.create({ databaseId, automationId, patch }));
}

function triggerItems(context: TableContext, automation: Automation) {
  const { trigger } = automation;
  const added: MenuItem = {
    label: TEXT.pageAdded,
    check: "radio",
    isChecked: trigger.kind === "page-added",
    keepsOpen: true,
    onSelect: () => {
      change(context, automation, { trigger: { kind: "page-added" } });
      goTo(context, `${AUTOMATION_PANEL}${automation.id}`);
    },
  };
  const edited = context.model.columns
    .filter(({ property, isTitle }) => !isTitle && !COMPUTED.has(property.type))
    .map(({ property }): MenuItem => ({
      label: TEXT.propertyEdited(property.name),
      check: "radio",
      isChecked:
        trigger.kind === "property-edited" &&
        trigger.propertyId === property.id,
      keepsOpen: true,
      onSelect: () => {
        const next = {
          kind: "property-edited",
          propertyId: property.id,
        } as const;
        change(context, automation, { trigger: next });
        goTo(context, `${AUTOMATION_PANEL}${automation.id}`);
      },
    }));
  return [added, ...edited];
}

// "When": what sets it off, chosen from a list of its own, searched.
function whenPanel(context: TableContext, automation: Automation) {
  return {
    title: TEXT.automationWhen,
    back: `${AUTOMATION_PANEL}${automation.id}`,
    search: COPY.database.searchProperty,
    items: triggerItems(context, automation),
  };
}

function actionItems(context: TableContext, automation: Automation) {
  const set = actionWords(context, automation).map(
    ({ propertyId, words }): MenuItem =>
      panelRow(
        context,
        { label: words, icon: "pencil" },
        `${VALUE_PANEL}${automation.id}:${propertyId}`,
      ),
  );
  const add = panelRow(
    context,
    { label: TEXT.editProperty, icon: "plus" },
    `${SET_PANEL}${automation.id}`,
  );
  return [
    ...set,
    add,
    addPageItem(context, automation),
    webhookItem(context, automation),
  ];
}

function editPanel(context: TableContext, automation: Automation) {
  const { dispatch, model } = context;
  const databaseId = model.database.id;
  const items: MenuEntry[] = [
    { kind: "section", label: TEXT.automationWhen },
    panelRow(
      context,
      { label: triggerWords(context, automation.trigger), icon: "bolt" },
      `${WHEN_PANEL}${automation.id}`,
    ),
    { kind: "section", label: TEXT.automationDo },
    ...actionItems(context, automation),
    { kind: "divider" },
    {
      label: TEXT.automationActive,
      check: "switch",
      isChecked: automation.isActive,
      keepsOpen: true,
      onSelect: () => {
        change(context, automation, { isActive: !automation.isActive });
      },
    },
    {
      label: TEXT.deleteAutomation,
      icon: "trash",
      isDanger: true,
      keepsOpen: true,
      onSelect: () => {
        const automationId = automation.id;
        dispatch(deleteAutomation.create({ databaseId, automationId }));
        goTo(context, "automations");
      },
    },
  ];
  return { title: TEXT.automation, back: "automations", items };
}

function setPanel(context: TableContext, automation: Automation) {
  const items = context.model.columns
    .filter(({ property }) => SETTABLE.has(property.type))
    .map(({ property }) =>
      panelRow(
        context,
        { label: property.name },
        `${VALUE_PANEL}${automation.id}:${property.id}`,
      ),
    );
  const back = `${AUTOMATION_PANEL}${automation.id}`;
  return { title: TEXT.editProperty, back, items };
}

function choicesOf(property: PropertyDefinition): unknown[] {
  if (property.type === "checkbox") return [true, false];
  if (property.type === "date") return [{ today: true }];
  const ids = (property.options ?? []).map((option) => option.id);
  return property.type === "multi-select" ? ids.map((id) => [id]) : ids;
}

function valuePanel(
  context: TableContext,
  automation: Automation,
  property: PropertyDefinition,
): SettingsPanel {
  const back = `${AUTOMATION_PANEL}${automation.id}`;
  const current = valueWords(property, automation.values[property.id]);
  const items = choicesOf(property).map((value): MenuItem => {
    const words = valueWords(property, value);
    return {
      label: words,
      check: "radio",
      isChecked: words === current,
      keepsOpen: true,
      onSelect: () => {
        const values = { ...automation.values, [property.id]: value };
        change(context, automation, { values });
        goTo(context, back);
      },
    };
  });
  return { title: property.name, back, items };
}

// The panels named by an automation alone, by their names' start.
const PANELS_OF: Readonly<
  Record<
    string,
    (context: TableContext, automation: Automation) => SettingsPanel
  >
> = {
  [AUTOMATION_PANEL]: editPanel,
  [SET_PANEL]: setPanel,
  [WHEN_PANEL]: whenPanel,
  [ADD_PANEL]: addPagePanel,
  [HOOK_PANEL]: webhookPanel,
};

// The panel a name stands for, when it names one of an automation's.
export function automationPanelOf(
  context: TableContext,
  name: string,
): SettingsPanel | undefined {
  const [kind = "", id = "", propertyId = ""] = name.split(":");
  const automation = automationOf(context, id);
  if (automation === undefined) return undefined;
  const build = PANELS_OF[`${kind}:`];
  if (build !== undefined) return build(context, automation);
  const property = context.model.database.props.properties.find(
    (item) => item.id === propertyId,
  );
  if (`${kind}:` !== VALUE_PANEL || property === undefined) return undefined;
  return valuePanel(context, automation, property);
}
