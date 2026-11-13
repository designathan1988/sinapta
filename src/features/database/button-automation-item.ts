// "Edit automation" in a button's column menu: it opens the automation
// dialog with the button's config as the draft to change.
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import { openOverlay, setOverlayDraft } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuItem } from "../../ui/menu/index.ts";
import { BUTTON_AUTOMATION_OVERLAY } from "./button-automation.ts";
import { readButtonPropertyConfig } from "./properties/button/index.ts";
import type { TableContext } from "./table-cell.view.ts";

export function editAutomationItem(
  property: PropertyDefinition,
  context: TableContext,
): MenuItem {
  return {
    label: COPY.automation.edit,
    icon: "compose",
    keepsOpen: true,
    onSelect: () => {
      const overlay = {
        kind: BUTTON_AUTOMATION_OVERLAY,
        anchorId: property.id,
      };
      context.dispatch(openOverlay.create({ overlay }));
      const draft = readButtonPropertyConfig(property.config);
      context.dispatch(setOverlayDraft.create({ draft }));
    },
  };
}
