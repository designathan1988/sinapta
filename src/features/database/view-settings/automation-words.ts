// How an automation reads in the view settings: its trigger ("Page
// added", "Status edited") and what it does ("Set Status to Done"), from
// the database's properties and their options.
import type {
  Automation,
  PropertyDefinition,
} from "../../../blocks/database/index.ts";
import { COPY } from "../../../ui/copy.ts";
import type { TableContext } from "../table-cell.view.ts";

const TEXT = COPY.database;

// The day it runs, as a value an automation sets.
function isToday(value: unknown): boolean {
  return typeof value === "object" && value !== null && "today" in value;
}

export function propertyNamed(
  context: TableContext,
  propertyId: string,
): PropertyDefinition | undefined {
  return context.model.database.props.properties.find(
    (property) => property.id === propertyId,
  );
}

// A value as words: an option's name, Checked, Unchecked or Today.
export function valueWords(
  property: PropertyDefinition,
  value: unknown,
): string {
  if (isToday(value)) return TEXT.today;
  if (typeof value === "boolean") return value ? TEXT.checked : TEXT.unchecked;
  const id: unknown = Array.isArray(value) ? value[0] : value;
  const option = property.options?.find((item) => item.id === id);
  return option?.name ?? "";
}

export function triggerWords(
  context: TableContext,
  trigger: Automation["trigger"],
): string {
  if (trigger.kind === "page-added") return TEXT.pageAdded;
  const name = propertyNamed(context, trigger.propertyId)?.name ?? "";
  return TEXT.propertyEdited(name);
}

// Each value it sets, as "Set <property> to <value>".
export function actionWords(
  context: TableContext,
  automation: Automation,
): { readonly propertyId: string; readonly words: string }[] {
  return Object.entries(automation.values).flatMap(([propertyId, value]) => {
    const property = propertyNamed(context, propertyId);
    if (property === undefined) return [];
    const words = TEXT.setTo(property.name, valueWords(property, value));
    return [{ propertyId, words }];
  });
}

export function automationSummary(
  context: TableContext,
  automation: Automation,
): { readonly label: string; readonly value: string } {
  const actions = actionWords(context, automation);
  return {
    label: triggerWords(context, automation.trigger),
    value: actions.map((action) => action.words).join(", "),
  };
}
