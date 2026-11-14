// Notion's AI autofill (ADR-0013): a property of a database filled for every
// row from the row's page, by the server's AI, and sent to every client as
// the server's own transaction.
import * as v from "valibot";
import {
  parseBlockId,
  type Block,
  type Operation,
  type Workspace,
} from "../src/model/index.ts";
import { answer, type ApiContext, type RouteTable } from "./api.ts";
import { askAi } from "./ai.ts";
import { sessionUser } from "./sessions.ts";
import { currentWorkspace } from "./workspace-state.ts";
import { logOperations, membership } from "./workspaces.ts";

const fillSchema = v.object({
  databaseId: v.string(),
  propertyId: v.string(),
  action: v.picklist(["summarize", "action-items", "translate", "shorter"]),
});

const AI_AUTHOR = { id: "pagecraft-ai", name: "Pagecraft AI" };

function spansText(props: Block["props"]): string {
  const text = props.text;
  if (!Array.isArray(text)) return "";
  return text
    .map((span: unknown) =>
      typeof span === "object" && span !== null && "text" in span
        ? String(span.text)
        : "",
    )
    .join("");
}

// A row page's own words: its blocks' text, line by line.
export function pageText(workspace: Workspace, page: Block): string {
  return page.childIds
    .map((id) => workspace.blocks[id])
    .flatMap((block) => (block === undefined ? [] : [spansText(block.props)]))
    .filter((line) => line !== "")
    .join("\n");
}

function filledRow(
  row: Block,
  fill: {
    readonly propertyId: string;
    readonly value: string;
    readonly now: string;
  },
) {
  const { propertyId, value, now } = fill;
  const values =
    typeof row.props.values === "object" && row.props.values !== null
      ? row.props.values
      : {};
  const props = { ...row.props, values: { ...values, [propertyId]: value } };
  const { id, ...rest } = row;
  const patch = { ...rest, props, updatedAt: now, editedBy: AI_AUTHOR };
  return { type: "record.update", kind: "block", id, patch } as const;
}

async function fillRows(
  workspace: Workspace,
  database: Block,
  body: v.InferOutput<typeof fillSchema>,
): Promise<Operation[]> {
  const now = new Date().toISOString();
  const operations: Operation[] = [];
  for (const rowId of database.childIds) {
    const row = workspace.blocks[rowId];
    const text = row === undefined ? "" : pageText(workspace, row);
    if (row === undefined || text === "") continue;
    const filled = await askAi(body.action, text);
    if (filled !== undefined) {
      operations.push(
        filledRow(row, { propertyId: body.propertyId, value: filled, now }),
      );
    }
  }
  return operations;
}

export const AI_FILL_ROUTES: RouteTable = {
  "POST /api/workspaces/:id/ai/fill": async (request, context: ApiContext) => {
    const user = sessionUser(context, request);
    if (user === undefined) return answer(401, { error: "signed-out" });
    const member = membership(context, request.params.id ?? "", user.id);
    if (member === undefined || member.role === "guest") {
      return answer(403, { error: "not-allowed" });
    }
    const body = v.parse(fillSchema, request.body);
    const workspace = currentWorkspace(context, member.id);
    const databaseId = parseBlockId(body.databaseId);
    const database =
      databaseId === undefined ? undefined : workspace?.blocks[databaseId];
    if (workspace === undefined || database === undefined) {
      return answer(404, { error: "not-found" });
    }
    const operations = await fillRows(workspace, database, body);
    if (operations.length === 0) return answer(200, { filled: 0 });
    const clientId = "pagecraft-ai-fill";
    const seq = logOperations(context, {
      workspaceId: member.id,
      userId: user.id,
      clientId,
      operations,
    });
    context.events.publish(member.id, "operations", {
      seq,
      clientId,
      operations,
    });
    return answer(200, { filled: operations.length });
  },
};
