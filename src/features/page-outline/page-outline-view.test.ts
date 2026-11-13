// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  toBlockId,
  type BlockSpec,
} from "../../model/index.ts";
import {
  createInitialState,
  type Command,
  type OpenOverlay,
} from "../../state/index.ts";
import { PAGE_OUTLINE_OVERLAY, renderPageOutline } from "./index.ts";

const HEADINGS: BlockSpec[] = [
  { id: "a", type: "heading", props: { level: 2, text: [{ text: "Plan" }] } },
  {
    id: "t",
    type: "toggle",
    props: { text: [{ text: "More" }], isOpen: false },
    children: [
      {
        id: "b",
        type: "heading",
        props: { level: 3, text: [{ text: "Steps" }] },
      },
    ],
  },
  { id: "c", type: "heading", props: { level: 3, text: [{ text: "Notes" }] } },
];

function rendered(overlay: OpenOverlay | null) {
  const workspace = buildWorkspace([{ id: "page", children: HEADINGS }]);
  const initial = createInitialState();
  const ui = { ...initial.ui, activePageId: toBlockId("page"), overlay };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderPageOutline({ ...initial, workspace, ui }, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  return { host, sent };
}

const OPEN = { kind: PAGE_OUTLINE_OVERLAY, anchorId: "page" };

describe("the floating outline", () => {
  it("draws a dash per heading and opens its list when pointed at", () => {
    const { host, sent } = rendered(null);
    const dashes = host.querySelector<HTMLElement>(".page-outline__dashes");

    expect(host.querySelectorAll(".page-outline__dash")).toHaveLength(3);
    dashes?.dispatchEvent(new Event("pointerenter"));

    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.openOverlay", overlay: OPEN }),
    ]);
  });

  it("opens its list from the keyboard, the dashes being a button", () => {
    const { host, sent } = rendered(null);

    host.querySelector<HTMLButtonElement>(".page-outline__dashes")?.click();

    expect(sent).toHaveLength(1);
  });

  it("opens the toggle holding a chosen heading, then puts the caret in it", () => {
    const { host, sent } = rendered(OPEN);
    const entry = host.querySelector<HTMLElement>('[aria-label="Go to Steps"]');

    entry?.click();

    expect(sent.map((command) => command.type)).toEqual([
      "ui.closeOverlay",
      "toggle.setOpen",
      "ui.setSelection",
    ]);
    expect(sent[1]).toEqual(
      expect.objectContaining({ blockId: toBlockId("t"), isOpen: true }),
    );
  });

  it("closes its list when the pointer leaves it", () => {
    const { host, sent } = rendered(OPEN);

    host
      .querySelector(".page-outline")
      ?.dispatchEvent(new Event("pointerleave"));

    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.closeOverlay" }),
    ]);
  });
});

describe("the floating outline by keyboard", () => {
  it("lists its headings as buttons, reached by Tab, Escape left to the overlay", () => {
    const { host } = rendered(OPEN);
    const entries = [
      ...host.querySelectorAll<HTMLButtonElement>(".page-outline__entry"),
    ];

    expect(entries).toHaveLength(3);
    expect(entries.every((entry) => entry.type === "button")).toBe(true);
    expect(
      host.querySelector(".page-outline__list")?.hasAttribute("data-overlay"),
    ).toBe(true);
    expect(
      host
        .querySelector(".page-outline__dashes")
        ?.getAttribute("aria-expanded"),
    ).toBe("true");
  });
});
