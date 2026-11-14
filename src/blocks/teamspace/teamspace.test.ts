import { describe, expect, it } from "vitest";
import { createTestApp } from "../../state/index.ts";
import { createPage } from "../page/index.ts";
import {
  archiveTeamspace,
  createTeamspace,
  setTeamspaceAccess,
  toggleTeamspaceMember,
} from "./teamspace.commands.ts";
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

  it("closes it to its members, who join and leave", () => {
    const { store, dispatch } = createTestApp({
      commands: [createTeamspace, setTeamspaceAccess, toggleTeamspaceMember],
    });
    dispatch(createTeamspace.create({ name: "Board", description: "" }));
    const [made] = selectTeamspaces(store.getState());
    if (made === undefined) throw new Error("no teamspace");
    const teamspaceId = made.id;

    dispatch(setTeamspaceAccess.create({ teamspaceId, access: "closed" }));
    dispatch(toggleTeamspaceMember.create({ teamspaceId, userId: "u1" }));
    dispatch(toggleTeamspaceMember.create({ teamspaceId, userId: "u2" }));
    dispatch(toggleTeamspaceMember.create({ teamspaceId, userId: "u1" }));

    expect(selectTeamspaces(store.getState())[0]?.props).toMatchObject({
      access: "closed",
      memberIds: ["u2"],
    });
  });
});

describe("archiveTeamspace", () => {
  it("archives a teamspace and brings it back", () => {
    const { store, dispatch } = createTestApp({
      commands: [createTeamspace, archiveTeamspace],
    });
    dispatch(createTeamspace.create({ name: "Ops", description: "" }));
    const [teamspace] = selectTeamspaces(store.getState());
    if (teamspace === undefined) throw new Error("no teamspace");
    const teamspaceId = teamspace.id;

    dispatch(archiveTeamspace.create({ teamspaceId, isArchived: true }));
    const archived = selectTeamspaces(store.getState())[0]?.props.isArchived;
    dispatch(archiveTeamspace.create({ teamspaceId, isArchived: false }));

    expect(archived).toBe(true);
    expect(selectTeamspaces(store.getState())[0]?.props.isArchived).toBe(false);
  });
});
