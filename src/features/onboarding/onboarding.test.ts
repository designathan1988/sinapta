import { describe, expect, it } from "vitest";
import { BLOCK_PROPS_SCHEMAS } from "../../blocks/index.ts";
import { selectPageTitle, selectPage } from "../../blocks/page/index.ts";
import { parseWorkspaceFile } from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import {
  onboardingCommands,
  seedGettingStarted,
} from "./onboarding.commands.ts";

function seed() {
  const app = createTestApp({ commands: onboardingCommands });
  app.dispatch(seedGettingStarted.create({}));
  return app.store.getState();
}

describe("workspace.seedGettingStarted", () => {
  it("adds a getting started page and a task database, and opens the page", () => {
    const state = seed();
    const [pageId, databaseId] = state.workspace.rootIds;
    const page = selectPage(state, pageId ?? null);
    const database = selectPage(state, databaseId ?? null);

    expect(page && selectPageTitle(page)).toBe("Getting started");
    expect(database?.type).toBe("database");
    expect(database?.childIds).toHaveLength(3);
    expect(
      Object.values(state.workspace.views).map((view) => view.type),
    ).toEqual(["table", "board", "calendar"]);
    expect(state.ui.activePageId).toBe(pageId);
  });

  it("writes only records that load back through the schemas", () => {
    const { workspace } = seed();
    const file: unknown = JSON.parse(
      JSON.stringify({ schemaVersion: 4, ...workspace }),
    );

    const result = parseWorkspaceFile(file, BLOCK_PROPS_SCHEMAS);

    expect(result).toMatchObject({ ok: true, skipped: [] });
  });

  it("is the starting point: there is nothing to undo after it", () => {
    expect(seed().history.undo).toEqual([]);
  });

  it("does nothing to a workspace that already has pages", () => {
    const app = createTestApp({ commands: onboardingCommands });
    app.dispatch(seedGettingStarted.create({}));
    const once = app.store.getState().workspace;

    app.dispatch(seedGettingStarted.create({}));

    expect(app.store.getState().workspace).toBe(once);
  });
});
