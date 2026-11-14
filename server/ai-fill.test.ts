import { describe, expect, it } from "vitest";
import { createEmptyWorkspace, SCHEMA_VERSION } from "../src/model/index.ts";
import { createTestServer } from "./test-context.ts";

const AT = "2026-11-14T00:00:00.000Z";

function block(
  id: string,
  spec: {
    type: string;
    parentId: string | null;
    childIds?: string[];
    props: object;
  },
) {
  return {
    id,
    type: spec.type,
    parentId: spec.parentId,
    childIds: spec.childIds ?? [],
    props: spec.props,
    createdAt: AT,
    updatedAt: AT,
  };
}

const PAGE = { icon: null, isFavorite: false, isTrashed: false };

const SNAPSHOT = {
  schemaVersion: SCHEMA_VERSION,
  rootIds: ["db"],
  blocks: {
    db: block("db", {
      type: "database",
      parentId: null,
      childIds: ["row"],
      props: { ...PAGE, title: [] },
    }),
    row: block("row", {
      type: "page",
      parentId: "db",
      childIds: ["p"],
      props: { ...PAGE, title: [{ text: "Launch" }] },
    }),
    p: block("p", {
      type: "paragraph",
      parentId: "row",
      props: {
        text: [
          {
            text: "The launch moved to Friday. We need a new kit. Grace calls the printer.",
          },
        ],
      },
    }),
  },
  views: {},
  settings: createEmptyWorkspace().settings,
};

function idOf(body: unknown): string {
  if (typeof body === "object" && body !== null && "workspace" in body) {
    const { workspace } = body;
    if (
      typeof workspace === "object" &&
      workspace !== null &&
      "id" in workspace &&
      typeof workspace.id === "string"
    ) {
      return workspace.id;
    }
  }
  throw new Error("no workspace");
}

describe("AI autofill", () => {
  it("fills a property of every row from its page and tells every client", async () => {
    const server = createTestServer();
    const signUp = await server.call("POST /api/account/sign-up", {
      email: "ada@pagecraft.test",
      password: "long enough",
      name: "Ada",
    });
    const ada = signUp.cookies?.[0] ?? "";
    const created = await server.call(
      "POST /api/workspaces",
      { name: "Ada's", snapshot: SNAPSHOT },
      ada,
    );
    const id = idOf(created.body);
    const heard: unknown[] = [];
    server.context.events.listen(id, (_event, data) => heard.push(data));

    const filled = await server.call(
      `POST /api/workspaces/${id}/ai/fill`,
      { databaseId: "db", propertyId: "summary", action: "summarize" },
      ada,
    );

    expect(filled.body).toEqual({ filled: 1 });
    expect(heard[0]).toMatchObject({
      operations: [
        {
          id: "row",
          patch: {
            props: {
              values: {
                summary: "The launch moved to Friday. We need a new kit.",
              },
            },
            editedBy: { name: "Pagecraft AI" },
          },
        },
      ],
    });
  });
});
