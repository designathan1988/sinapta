// Using a template: a new top-level page made from it, with new ids, and
// opened; one step to undo.
import { listOf, siblingIds, type Operation } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { countSeedBlocks, placeSeed } from "../onboarding/index.ts";
import { templateNamed } from "./template-gallery.ts";

export const useTemplate = defineCommand<{ templateId: string }>({
  type: "template.use",
  newIds: (payload) => {
    const found = templateNamed(payload.templateId);
    return { blocks: found === undefined ? 0 : countSeedBlocks(found.seed) };
  },
  handle(state, command) {
    const found = templateNamed(command.templateId);
    if (found === undefined) return {};
    const { blockIds, now } = command.meta;
    const records = placeSeed(found.seed, null, {
      ids: blockIds,
      now,
      next: 0,
    });
    const root = records[0];
    if (root === undefined) return {};
    const index = siblingIds(state.workspace, null).length;
    const operations: Operation[] = [
      ...records.map((record): Operation => ({
        type: "record.create",
        kind: "block",
        record,
      })),
      { type: "list.insert", list: listOf(null), id: root.id, index },
    ];
    return {
      operations,
      ui: { ...state.ui, activePageId: root.id, overlay: null, peek: null },
    };
  },
});

export const templateCommands = [useTemplate];
