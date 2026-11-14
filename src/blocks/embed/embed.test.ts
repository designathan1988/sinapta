// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createTestApp, type Command } from "../../state/index.ts";
import {
  embedCommands,
  setEmbedHeight,
  setEmbedUrl,
} from "./embed.commands.ts";
import { toEmbedUrl } from "./embed-hosts.ts";
import type { EmbedBlock } from "./embed.schema.ts";
import { renderEmbed } from "./embed.view.ts";

const EMBED = toBlockId("e");

describe("toEmbedUrl", () => {
  it.each([
    [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    ],
    [
      "https://youtu.be/dQw4w9WgXcQ?t=3",
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    ],
    ["https://vimeo.com/76979871", "https://player.vimeo.com/video/76979871"],
    ["https://www.loom.com/share/abc123", "https://www.loom.com/embed/abc123"],
    [
      "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
      "https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC",
    ],
    [
      "https://codepen.io/ana/pen/xyz",
      "https://codepen.io/ana/embed/xyz?default-tab=result",
    ],
    [
      "https://x.com/someone/status/12345",
      "https://platform.twitter.com/embed/Tweet.html?id=12345",
    ],
    [
      "https://docs.google.com/document/d/abc/edit",
      "https://docs.google.com/document/d/abc/preview",
    ],
    [
      "https://gist.github.com/ana/0a1b2c",
      "https://gist.github.com/ana/0a1b2c.pibb",
    ],
    [
      "https://miro.com/app/board/uXjVabc=/",
      "https://miro.com/app/live-embed/uXjVabc=/",
    ],
    ["https://codesandbox.io/s/x1y2z3", "https://codesandbox.io/embed/x1y2z3"],
    [
      "https://acme.typeform.com/to/AbCd12",
      "https://form.typeform.com/to/AbCd12",
    ],
    [
      "https://drive.google.com/file/d/f1/view?usp=sharing",
      "https://drive.google.com/file/d/f1/preview",
    ],
    [
      "https://excalidraw.com/#json=abc,key",
      "https://excalidraw.com/#json=abc,key",
    ],
    ["https://whimsical.com/flow-AbC", "https://whimsical.com/embed/flow-AbC"],
    [
      "https://airtable.com/appX/shrY?backgroundColor=red",
      "https://airtable.com/embed/appX/shrY",
    ],
  ])("turns %s into its embed address", (url, embed) => {
    expect(toEmbedUrl(url)).toBe(embed);
  });

  it.each([
    "https://example.com/page",
    "http://www.youtube.com/watch?v=x",
    "not a url",
  ])("refuses %s", (url) => {
    expect(toEmbedUrl(url)).toBeUndefined();
  });
});

function createApp() {
  const workspace = buildWorkspace([
    { id: "page", children: [{ id: "e", type: "embed", props: { url: "" } }] },
  ]);
  const app = createTestApp({ workspace, commands: embedCommands });
  const props = () => app.store.getState().workspace.blocks[EMBED]?.props;
  return { ...app, props };
}

describe("embed commands", () => {
  it("take an address from an allowed host and refuse any other", () => {
    const { dispatch, props } = createApp();

    dispatch(
      setEmbedUrl.create({ blockId: EMBED, url: "https://example.com" }),
    );
    expect(props()?.url).toBe("");
    dispatch(
      setEmbedUrl.create({ blockId: EMBED, url: "https://vimeo.com/1" }),
    );
    expect(props()?.url).toBe("https://vimeo.com/1");
  });

  it("keep the height within limits", () => {
    const { dispatch, props } = createApp();

    dispatch(setEmbedHeight.create({ blockId: EMBED, height: 5000 }));
    expect(props()?.height).toBe(1200);
    dispatch(setEmbedHeight.create({ blockId: EMBED, height: 10 }));
    expect(props()?.height).toBe(160);
  });
});

describe("renderEmbed", () => {
  it("frames the embed address, sandboxed and lazily", () => {
    const block: EmbedBlock = {
      id: EMBED,
      type: "embed",
      parentId: toBlockId("page"),
      childIds: [],
      props: { url: "https://vimeo.com/1", height: 360 },
      createdAt: "",
      updatedAt: "",
    };
    const sent: Command[] = [];
    const host = document.createElement("div");
    render(
      renderEmbed(block, (command) => {
        sent.push(command);
        return { ok: true };
      }),
      host,
    );
    const frame = host.querySelector("iframe");

    expect(frame?.getAttribute("src")).toBe("https://player.vimeo.com/video/1");
    expect(frame?.getAttribute("sandbox")).toBe(
      "allow-scripts allow-same-origin allow-popups",
    );
    expect(frame?.getAttribute("loading")).toBe("lazy");
    host
      .querySelector("[role=slider]")
      ?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );
    expect(sent).toEqual([
      expect.objectContaining({ type: "embed.setHeight", height: 400 }),
    ]);
  });

  it("says why an address cannot be embedded", () => {
    const block: EmbedBlock = {
      id: EMBED,
      type: "embed",
      parentId: toBlockId("page"),
      childIds: [],
      props: { url: "" },
      createdAt: "",
      updatedAt: "",
    };
    const host = document.createElement("div");
    render(
      renderEmbed(block, () => ({ ok: true })),
      host,
    );
    const input = host.querySelector<HTMLInputElement>("input[name=url]");
    const form = host.querySelector("form");
    if (input === null || form === null) throw new Error("no field");

    input.value = "https://example.com";
    form.dispatchEvent(new SubmitEvent("submit", { cancelable: true }));

    expect(input.getAttribute("aria-invalid")).toBe("true");
  });
});
