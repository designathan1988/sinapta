// The requests that leave the open workspace as it is: its integrations
// and connected apps, and its billing and plan.
import type { SyncRequest } from "../state/index.ts";
import {
  answerBilling,
  isBillingRequest,
  type BillingRequest,
  type BillingTarget,
} from "./billing-client.ts";
import {
  answerIntegrations,
  isIntegrationRequest,
  type IntegrationRequest,
} from "./integration-client.ts";
import type { Sync } from "./sync-session.ts";

// True when the request was one of these, now on its way.
export function answerSide(
  sync: Sync,
  request: SyncRequest,
  target: BillingTarget,
): request is IntegrationRequest | BillingRequest {
  if (isIntegrationRequest(request)) {
    void answerIntegrations(sync, request, target.workspaceId);
    return true;
  }
  if (isBillingRequest(request)) {
    void answerBilling(sync, request, target);
    return true;
  }
  return false;
}
