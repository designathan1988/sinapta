import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  TEST_PROPS_SCHEMAS,
  toBlockId,
  type Operation,
  type Workspace,
} from "../model/index.ts";
import { createTestApp, syncCommands, type Command } from "../state/index.ts";
import { download } from "./sync-download.ts";
import { withUnsent } from "./sync-outbox.ts";
import type { Link, Session, Sync } from "./sync-session.ts";
import { serializeWorkspace } from "./workspace-file.ts";

const LINE = toBlockId("line");

function workspaceWith(text: string): Workspace {
  return buildWorkspace([
    {
      id: "page",
      children: [{ id: "line", type: "page", props: { text: [{ text }] } }],
    },
  ]);
}

// The line's text as one transaction sends it: the whole record. (The
// test schemas read every block as a page; its props are any.)
function typed(text: string): Operation[] {
  const record = workspaceWith(text).blocks[LINE];
  if (record === undefined) throw new Error("setup");
  return [{ type: "record.update", kind: "block", id: LINE, patch: record }];
}

function snapshotOf(workspace: Workspace): unknown {
  const value: unknown = JSON.parse(serializeWorkspace(workspace));
  return value;
}

function textOf(workspace: Workspace): string {
  const props = workspace.blocks[LINE]?.props;
  return Array.isArray(props?.text)
    ? props.text.map((span: { text: string }) => span.text).join("")
    : "";
}

describe("this browser's unconfirmed changes on the server's workspace", () => {
  it("are made again on it in turn, each to be sent with its undo", () => {
    const merged = withUnsent(workspaceWith("Third "), [
      typed("Third l"),
      typed("Third line"),
    ]);

    expect(textOf(merged.workspace)).toBe("Third line");
    expect(merged.pending).toHaveLength(2);
    expect(merged.pending[1]?.inverse.length).toBeGreaterThan(0);
  });

  it("drop one that cannot be made again, and keep the rest", () => {
    const gone: Operation[] = [
      {
        type: "record.update",
        kind: "block",
        id: toBlockId("gone"),
        patch: {},
      },
    ];

    const merged = withUnsent(workspaceWith("Third "), [
      gone,
      typed("Third l"),
    ]);

    expect(textOf(merged.workspace)).toBe("Third l");
    expect(merged.pending).toHaveLength(1);
  });
});

describe("reading the workspace again while typing", () => {
  it("never shows older text: the outbox and the keys typed meanwhile are on it", async () => {
    const app = createTestApp({ commands: syncCommands });
    const loads: Workspace[] = [];
    const server = {
      workspace: {
        id: "w1",
        name: "Ada's",
        icon: null,
        role: "owner",
        members: 1,
      },
      seq: 3,
      snapshot: snapshotOf(workspaceWith("Third ")),
      operations: [],
    };
    const send = () =>
      Promise.resolve(new Response(JSON.stringify(server), { status: 200 }));
    const sync: Sync = {
      store: app.store,
      dispatch: (command: Command) => {
        const done = app.dispatch(command);
        if (command.type === "sync.loadServerWorkspace")
          loads.push(app.store.getState().workspace);
        return done;
      },
      send,
      propsSchemas: TEST_PROPS_SCHEMAS,
      openEvents: () => ({
        addEventListener: () => undefined,
        close: () => undefined,
      }),
      outbox: {
        load: () =>
          Promise.resolve({ workspaceId: "w1", entries: [typed("Third l")] }),
        save: () => Promise.resolve(),
      },
    };
    const session: Session = {
      id: "w1",
      clientId: "c1",
      events: sync.openEvents(""),
      seq: 0,
      isReady: false,
      buffered: [],
      pending: [],
      unsent: 0,
      isSending: true,
    };
    // "Third line" was typed while the workspace was being read.
    const link: Link = {
      sync,
      session,
      held: [typed("Third line")],
      resync: () => undefined,
    };

    await download(link, sync, session);

    expect(loads.map(textOf)).toEqual(["Third line"]);
    expect(session.unsent).toBe(2);
    expect(session.isReady).toBe(true);
    expect(link.held).toEqual([]);
  });
});
