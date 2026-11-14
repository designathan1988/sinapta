import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";
import { selectPagePlace } from "./page-place.selectors.ts";

const PAGE = { icon: null, isFavorite: false, isTrashed: false };

function state(shared: string[] = []): AppState {
  const initial = createInitialState();
  const workspace = buildWorkspace([
    { id: "mine", props: { ...PAGE, title: [{ text: "Mine" }] } },
    {
      id: "team",
      type: "teamspace",
      props: { name: "Design", icon: null, description: "" },
      children: [{ id: "spec", props: { ...PAGE, title: [{ text: "Spec" }] } }],
    },
  ]);
  const sync = { ...initial.persistence.sync, shared };
  return {
    ...initial,
    workspace,
    persistence: { ...initial.persistence, sync },
  };
}

describe("selectPagePlace", () => {
  it("names a top page Private, or Shared once shared with people", () => {
    expect(selectPagePlace(state(), toBlockId("mine"))).toEqual({
      kind: "private",
    });
    expect(selectPagePlace(state(["mine"]), toBlockId("mine"))).toEqual({
      kind: "shared",
    });
  });

  it("names the teamspace of a page inside one", () => {
    expect(selectPagePlace(state(), toBlockId("spec"))).toMatchObject({
      kind: "teamspace",
      teamspace: { props: { name: "Design" } },
    });
  });
});
