// A feed view's options, as Notion's: "Wrap properties", which lets a
// post's values take more lines instead of being cut.
import type { FeedOptions, ViewId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";

export const DEFAULT_FEED_OPTIONS: FeedOptions = { wrapProperties: false };

export const setFeedOptions = defineCommand<{
  viewId: ViewId;
  options: Partial<FeedOptions>;
}>({
  type: "view.setFeedOptions",
  handle(state, command) {
    const view = state.workspace.views[command.viewId];
    if (view === undefined) return {};
    const feed = { ...(view.feed ?? DEFAULT_FEED_OPTIONS), ...command.options };
    return {
      operations: [
        { type: "record.update", kind: "view", id: view.id, patch: { feed } },
      ],
    };
  },
});

export const feedOptionCommands = [setFeedOptions];
