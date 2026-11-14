import { describe, expect, it } from "vitest";
import { buildWorkspace } from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";
import { selectShownTeamspaces } from "./teamspace-filters.view.ts";

function state(query: string, access?: string): AppState {
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
      props: { name: "Board", icon: null, description: "", access: "closed" },
    },
  ]);
  const values = access === undefined ? {} : { values: { access: [access] } };
  const overlay = {
    kind: "settings",
    anchorId: "teamspaces",
    query,
    ...values,
  };
  return { ...initial, workspace, ui: { ...initial.ui, overlay } };
}

const names = (shown: ReturnType<typeof selectShownTeamspaces>) =>
  shown.map((teamspace) => teamspace.props.name);

describe("the teamspaces' filters", () => {
  it("keeps the teamspaces whose name holds the search", () => {
    expect(names(selectShownTeamspaces(state("ENG")))).toEqual(["Engineering"]);
  });

  it("keeps those of the access chosen, an unset access counting as open", () => {
    expect(names(selectShownTeamspaces(state("", "closed")))).toEqual([
      "Board",
    ]);
    expect(names(selectShownTeamspaces(state("", "open")))).toEqual([
      "Engineering",
    ]);
  });
});
