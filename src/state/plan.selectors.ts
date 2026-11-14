// The open workspace's plan and its limits; none in the browser's own
// copy, which no server holds.
import { PLAN_LIMITS, type PlanId, type PlanLimits } from "../model/index.ts";
import type { AppState } from "./app-state.ts";

export function selectWorkspacePlan(state: AppState): PlanId | undefined {
  const { workspaces, workspaceId } = state.persistence.sync;
  return workspaces.find((workspace) => workspace.id === workspaceId)?.plan;
}

export function selectPlanLimits(state: AppState): PlanLimits | undefined {
  const plan = selectWorkspacePlan(state);
  return plan === undefined ? undefined : PLAN_LIMITS[plan];
}
