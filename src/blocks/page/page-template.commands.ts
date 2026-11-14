// "Save as template": the page joins the template gallery's "Your
// templates", or leaves it; the page itself stays where it is.
import type { BlockId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { selectPage } from "./page.selectors.ts";

export const setPageTemplate = defineCommand<{
  pageId: BlockId;
  isTemplate: boolean;
}>({
  type: "page.setTemplate",
  handle(state, command) {
    const page = selectPage(state, command.pageId);
    if (page === undefined) return {};
    const { isTemplate: _old, ...rest } = page.props;
    const props = command.isTemplate ? { ...rest, isTemplate: true } : rest;
    return {
      operations: [
        { type: "record.update", kind: "block", id: page.id, patch: { props } },
      ],
    };
  },
});

export const pageTemplateCommands = [setPageTemplate];
