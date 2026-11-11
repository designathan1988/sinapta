// A panel of the view settings: its rows, what sits above them, and the
// panel its back button returns to. Panels change through the overlay's
// panel, so the store says which one is shown.
import type { TemplateResult } from "lit-html";
import { openOverlayPanel } from "../../../state/index.ts";
import type { MenuEntry, MenuItem } from "../../../ui/menu/index.ts";
import type { TableContext } from "../table-cell.view.ts";

export interface SettingsPanel {
  readonly title: string;
  readonly items: readonly MenuEntry[];
  readonly lead?: TemplateResult;
  // The panel the back button shows; undefined for the first panel.
  readonly back?: string | null;
  // A placeholder when the panel's rows can be searched.
  readonly search?: string;
}

// Shows a panel; null shows the first one.
export function goTo(context: TableContext, panel: string | null): void {
  context.dispatch(openOverlayPanel.create({ panel }));
}

// A row that shows its current value and opens the panel that changes it.
export function panelRow(
  context: TableContext,
  row: Pick<MenuItem, "label" | "icon" | "value">,
  panel: string,
): MenuItem {
  return {
    ...row,
    opensPanel: true,
    onSelect: () => {
      goTo(context, panel);
    },
  };
}

export interface Choice<TValue extends string> {
  readonly value: TValue;
  readonly label: string;
  readonly icon?: MenuItem["icon"];
}

export interface Setting<TValue extends string> {
  readonly choices: readonly Choice<TValue>[];
  readonly value: TValue | undefined;
  // The panel that holds the setting, shown again after a choice.
  readonly back: string | null;
  readonly choose: (value: TValue) => void;
}

// The options of one setting, the current one checked; choosing one
// changes it and goes back to the panel that holds the setting.
export function choiceItems<TValue extends string>(
  context: TableContext,
  setting: Setting<TValue>,
): MenuItem[] {
  return setting.choices.map((choice) => ({
    label: choice.label,
    ...(choice.icon !== undefined && { icon: choice.icon }),
    check: "radio",
    isChecked: choice.value === setting.value,
    keepsOpen: true,
    onSelect: () => {
      setting.choose(choice.value);
      goTo(context, setting.back);
    },
  }));
}
