// A sidebar section's "Template": the template its "+" starts pages from,
// Empty or one of the database's templates, as Notion's; with none chosen
// the view's default shows as the choice.
import type { BlockId } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuItem } from "../../ui/menu/index.ts";
import { choiceItem, type ChoiceRow } from "./sidebar-view-choice.ts";
import type { Section } from "./sidebar-views.selectors.ts";

const TEXT = COPY.sidebarViews;
const EMPTY = "empty";

export function templateItem(
  submenuId: string,
  section: Section,
  onPick: (templateId: BlockId | null) => void,
): MenuItem {
  const { entry, templates, defaultTemplateId } = section;
  const chosen =
    entry.templateId === undefined ? defaultTemplateId : entry.templateId;
  const row: ChoiceRow<string> = {
    label: TEXT.template,
    icon: "templates",
    id: "template",
    current: chosen ?? EMPTY,
  };
  const empty = {
    value: EMPTY,
    label: TEXT.emptyTemplate,
    pick: () => {
      onPick(null);
    },
  };
  return choiceItem(submenuId, row, [
    empty,
    ...templates.map((template) => ({
      value: template.id,
      label: template.title,
      pick: () => {
        onPick(template.id);
      },
    })),
  ]);
}
