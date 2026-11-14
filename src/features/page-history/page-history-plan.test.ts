import { describe, expect, it } from "vitest";
import type { PlanId } from "../../model/index.ts";
import {
  createInitialState,
  type AppState,
  type PageVersion,
} from "../../state/index.ts";
import { selectShownVersions } from "./page-history.selectors.ts";

const NOW = Date.parse("2026-11-14T12:00:00.000Z");
const DAY = 86_400_000;

function version(daysAgo: number): PageVersion {
  return {
    id: `v${String(daysAgo)}`,
    takenAt: new Date(NOW - daysAgo * DAY).toISOString(),
    blocks: [],
  };
}

const VERSIONS = [version(1), version(10), version(45), version(200)];

function onPlan(plan: PlanId | undefined): AppState {
  const state = createInitialState();
  if (plan === undefined) return state;
  const workspace = {
    id: "w1",
    name: "W",
    icon: null,
    role: "owner",
    members: 1,
    plan,
  };
  const sync = {
    ...state.persistence.sync,
    workspaces: [workspace],
    workspaceId: "w1",
  };
  return { ...state, persistence: { ...state.persistence, sync } };
}

function shownIds(plan: PlanId | undefined) {
  const { shown, hidden } = selectShownVersions(onPlan(plan), VERSIONS, NOW);
  return { ids: shown.map((each) => each.id), hidden };
}

describe("a page's history on each plan", () => {
  it.each([
    ["free", ["v1"], 3],
    ["plus", ["v1", "v10"], 2],
    ["business", ["v1", "v10", "v45"], 1],
    ["enterprise", ["v1", "v10", "v45", "v200"], 0],
  ] as const)(
    "on %s shows %j and keeps %i out of view",
    (plan, ids, hidden) => {
      expect(shownIds(plan)).toEqual({ ids, hidden });
    },
  );

  it("shows every version of the browser's own copy", () => {
    expect(shownIds(undefined).hidden).toBe(0);
  });
});
