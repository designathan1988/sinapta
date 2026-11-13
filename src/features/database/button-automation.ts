// The automation of a button being edited, before Save: kept as the open
// overlay's draft and read back with the button's schema; a new action
// of each kind, and the values a property is given, written as the text
// a select chooses between.
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { OpenOverlay } from "../../state/index.ts";
import {
  BUTTON_AUTOMATION_OVERLAY,
  isToday,
  readButtonPropertyConfig,
  variableOf,
  type ButtonActionKind,
  type ButtonPropertyAction,
  type ButtonPropertyConfig,
} from "./properties/button/index.ts";

export { BUTTON_AUTOMATION_OVERLAY };

export const NEW_ACTION_LIST = "button-new-action";

export const ACTION_KINDS: readonly ButtonActionKind[] = [
  "set-values",
  "add-page",
  "edit-pages",
  "confirm",
  "open-page",
  "define-variables",
];

export function draftOf(
  overlay: OpenOverlay | null,
): ButtonPropertyConfig | undefined {
  return overlay?.kind === BUTTON_AUTOMATION_OVERLAY &&
    overlay.draft !== undefined
    ? readButtonPropertyConfig(overlay.draft)
    : undefined;
}

export function newAction(
  kind: ButtonActionKind,
  databaseId: string,
): ButtonPropertyAction {
  switch (kind) {
    case "set-values":
      return { kind, values: {} };
    case "add-page":
    case "edit-pages":
      return { kind, databaseId, values: {} };
    case "confirm":
      return { kind, message: "" };
    case "open-page":
      return { kind };
    case "define-variables":
      return { kind, variables: [{ name: "", expression: "" }] };
    default: {
      const unknown: never = kind;
      return unknown;
    }
  }
}

// The draft with the action at index replaced, or taken out for null.
export function withAction(
  draft: ButtonPropertyConfig,
  index: number,
  action: ButtonPropertyAction | null,
): ButtonPropertyConfig {
  const actions = draft.actions.flatMap((each, at) =>
    at !== index ? [each] : action === null ? [] : [action],
  );
  return { ...draft, actions };
}

// A first value a property can be given.
export function firstValue(property: PropertyDefinition): unknown {
  if (property.type === "checkbox") return true;
  if (property.type === "date") return { today: true };
  const option = property.options?.[0]?.id;
  if (property.type === "multi-select")
    return option === undefined ? [] : [option];
  return option ?? "";
}

// A value as the text its select shows it by.
export function choiceOf(value: unknown): string {
  if (isToday(value)) return "today";
  const variable = variableOf(value);
  if (variable !== undefined) return `v:${variable}`;
  if (typeof value === "boolean") return value ? "b:1" : "b:0";
  if (Array.isArray(value)) return `o:${String(value[0] ?? "")}`;
  return typeof value === "string" ? `o:${value}` : "";
}

// The value a select's choice stands for, for a property of this type.
export function valueOfChoice(choice: string, type: string): unknown {
  if (choice === "today") return { today: true };
  if (choice.startsWith("v:")) return { variable: choice.slice(2) };
  if (choice.startsWith("b:")) return choice === "b:1";
  const id = choice.slice(2);
  return type === "multi-select" ? [id] : id;
}

// The variables the draft defines, by name.
export function variableNames(draft: ButtonPropertyConfig): string[] {
  return draft.actions.flatMap((action) =>
    action.kind === "define-variables"
      ? action.variables.flatMap((each) =>
          each.name === "" ? [] : [each.name],
        )
      : [],
  );
}
