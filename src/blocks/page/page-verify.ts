// Notion's page verification (ADR-0013): who verified a page, when, and
// until when; the dispatcher's clock dates it, so the command stays pure.
import type { BlockId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { selectPage } from "./page.selectors.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

// Verifies a page for so many days, or with no end (null); "off" removes
// the verification.
export const setPageVerified = defineCommand<{
  pageId: BlockId;
  days: number | null | "off";
}>({
  type: "page.setVerified",
  handle(state, command) {
    const page = selectPage(state, command.pageId);
    if (page === undefined) return {};
    const { verification, ...rest } = page.props;
    const now = command.meta.now;
    const by = state.persistence.account.user?.name ?? "You";
    const { days } = command;
    const until =
      days === null || days === "off"
        ? null
        : new Date(Date.parse(now) + days * DAY_MS).toISOString();
    const props =
      days === "off" ? rest : { ...rest, verification: { by, at: now, until } };
    return {
      operations: [
        { type: "record.update", kind: "block", id: page.id, patch: { props } },
      ],
    };
  },
});

export const pageVerifyCommands = [setPageVerified];
