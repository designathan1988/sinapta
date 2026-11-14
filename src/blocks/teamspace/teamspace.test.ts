import { describe, expect, it } from "vitest";
import { createTestApp } from "../../state/index.ts";
import { createPage } from "../page/index.ts";
import { createTeamspace } from "./teamspace.commands.ts";
import { selectTeamspaces } from "./teamspace.selectors.ts";

describe("createTeamspace", () => {
  it("adds a named teamspace at the top, open in the sidebar", () => {
    const { store, dispatch } = createTestApp({ commands: [createTeamspace] });

    dispatch(
      createTeamspace.create({ name: " Engineering ", description: "Specs" }),
    );

    const state = store.getState();
    const [teamspace] = selectTeamspaces(state);
    expect(teamspace?.props).toEqual({
      name: "Engineering",
      icon: null,
      description: "Specs",
    });
    expect(state.ui.expandedPageIds).toContain(teamspace?.id);
  });

  it("makes nothing without a name", () => {
    const { store, dispatch } = createTestApp({ commands: [createTeamspace] });

    dispatch(createTeamspace.create({ name: "  ", description: "" }));

    expect(selectTeamspaces(store.getState())).toEqual([]);
  });

  it("holds the pages made inside it", () => {
    const { store, dispatch } = createTestApp({
      commands: [createTeamspace, createPage],
    });
    dispatch(createTeamspace.create({ name: "Design", description: "" }));
    const [teamspace] = selectTeamspaces(store.getState());
    if (teamspace === undefined) throw new Error("no teamspace");

    dispatch(createPage.create({ parentId: teamspace.id }));

    const [inside] = selectTeamspaces(store.getState());
    expect(inside?.childIds).toHaveLength(1);
  });
});
