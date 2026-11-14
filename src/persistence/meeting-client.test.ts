import { describe, expect, it } from "vitest";
import { createTestApp, setWorkspaces } from "../state/index.ts";
import { serverTranscriber } from "./meeting-client.ts";

describe("serverTranscriber", () => {
  it("sends the audio to the open workspace and gives back its words", async () => {
    const app = createTestApp({ commands: [setWorkspaces] });
    const workspace = {
      id: "w1",
      name: "Acme",
      icon: null,
      role: "owner",
      members: 1,
    };
    app.dispatch(
      setWorkspaces.create({ workspaces: [workspace], workspaceId: "w1" }),
    );
    const asked: string[] = [];
    const send = (input: string | URL | Request, init?: RequestInit) => {
      const body = typeof init?.body === "string" ? init.body : "";
      asked.push(`${typeof input === "string" ? input : ""} ${body}`);
      return Promise.resolve(
        new Response(JSON.stringify({ text: "We ship on Friday." })),
      );
    };

    const text = await serverTranscriber(app.store, send)("AAAA");

    expect(text).toBe("We ship on Friday.");
    expect(asked).toEqual(['/api/workspaces/w1/transcribe {"audio":"AAAA"}']);
  });

  it("hears nothing while no workspace is open", async () => {
    const app = createTestApp();
    const send = () => Promise.reject(new Error("not asked"));

    expect(await serverTranscriber(app.store, send)("AAAA")).toBe("");
  });
});
