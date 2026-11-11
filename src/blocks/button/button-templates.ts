// The blocks a button inserts, written as Markdown lines in its settings:
// "## Notes" for a heading, "- [ ] Call" for a to-do, and so on.
import { plainText } from "../../model/index.ts";
import { parseMarkdownBlocks } from "../../ui/rich-text/index.ts";
import {
  TEMPLATE_TYPES,
  type BlockTemplate,
  type ButtonAction,
} from "./button.schema.ts";

type TemplateType = (typeof TEMPLATE_TYPES)[number];

function isTemplateType(kind: string): kind is TemplateType {
  return TEMPLATE_TYPES.some((type) => type === kind);
}

const LEVELS = [1, 2, 3, 4] as const;

export function templatesFromMarkdown(markdown: string): BlockTemplate[] {
  return parseMarkdownBlocks(markdown).flatMap((block): BlockTemplate[] => {
    const { kind, text } = block;
    if (!isTemplateType(kind)) return [];
    if (kind === "heading") {
      const level = LEVELS.find((value) => value === block.level) ?? 1;
      return [{ type: kind, text, level }];
    }
    if (kind === "to-do") {
      return [{ type: kind, text, isChecked: block.isChecked === true }];
    }
    return [{ type: kind, text }];
  });
}

function prefixOf(template: BlockTemplate): string {
  switch (template.type) {
    case "heading":
      return `${"#".repeat(template.level ?? 1)} `;
    case "bulleted-list":
    case "toggle":
      return "- ";
    case "numbered-list":
      return "1. ";
    case "to-do":
      return template.isChecked === true ? "- [x] " : "- [ ] ";
    case "quote":
      return "> ";
    default:
      return "";
  }
}

export function templatesToMarkdown(
  templates: readonly BlockTemplate[],
): string {
  return templates
    .map((template) => `${prefixOf(template)}${plainText(template.text)}`)
    .join("\n");
}

// The actions with the one of this kind replaced, or removed when there
// is no new one.
export function withAction(
  actions: readonly ButtonAction[],
  kind: ButtonAction["kind"],
  action: ButtonAction | undefined,
): ButtonAction[] {
  const others = actions.filter((each) => each.kind !== kind);
  return action === undefined ? others : [...others, action];
}
