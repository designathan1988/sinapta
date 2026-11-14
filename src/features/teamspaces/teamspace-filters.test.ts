import { describe, expect, it } from "vitest";
import { buildWorkspace } from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";
import { selectTeamspaceTable } from "./teamspace-table.selectors.ts";

function state(query: string, values: Record<string, string[]> = {}): AppState {
  const initial = createInitialState();
  const workspace = buildWorkspace([
    {
      id: "eng",
      type: "teamspace",
      props: { name: "Engineering", icon: null, description: "" },
    },
    {
      id: "board",
      type: "teamspace",
      props: {
        name: "Board",
        icon: null,
        description: "",
        access: "closed",
        security: { noGuests: true },
      },
    },
    {
      id: "old",
      type: "teamspace",
      props: { name: "Old", icon: null, description: "", isArchived: true },
    },
  ]);
  const overlay = { kind: "settings", anchorId: "teamspaces", query, values };
  return { ...initial, workspace, ui: { ...initial.ui, overlay } };
}

const names = (s: AppState) => selectTeamspaceTable(s).map((row) => row.name);

describe("the teamspaces' filters", () => {
  it("shows the active ones whose name holds the search", () => {
    expect(names(state(""))).toEqual(["Engineering", "Board"]);
    expect(names(state("ENG"))).toEqual(["Engineering"]);
  });

  it("filters by status, access and security overrides", () => {
    expect(names(state("", { status: ["archived"] }))).toEqual(["Old"]);
    expect(names(state("", { access: ["closed"] }))).toEqual(["Board"]);
    expect(names(state("", { security: ["overrides"] }))).toEqual(["Board"]);
  });
});
