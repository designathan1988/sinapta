// A row of a sidebar section's menu whose submenu holds one choice per
// value, the current one ticked and its label shown at the row's end.
import type { IconName } from "../../ui/icon/index.ts";
import type { MenuEntry, MenuItem } from "../../ui/menu/index.ts";

export interface ChoiceRow<T> {
  readonly label: string;
  readonly icon: IconName;
  readonly id: string;
  readonly current: T;
}

interface Choice<T> {
  readonly value: T;
  readonly label: string;
  readonly pick: () => void;
}

// A row whose submenu holds one choice per value, the current one ticked.
export function choiceItem<T extends string | number>(
  submenuId: string,
  row: ChoiceRow<T>,
  choices: readonly Choice<T>[],
): MenuItem {
  const items = choices.map((choice): MenuEntry => ({
    label: choice.label,
    check: "radio",
    isChecked: choice.value === row.current,
    onSelect: choice.pick,
  }));
  const value = choices.find((choice) => choice.value === row.current)?.label;
  return {
    label: row.label,
    icon: row.icon,
    ...(value !== undefined && { value }),
    submenu: {
      id: `${submenuId}-${row.id}`,
      menu: () => ({ label: row.label, items }),
    },
  };
}
