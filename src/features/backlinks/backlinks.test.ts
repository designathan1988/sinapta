import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState } from "../../state/index.ts";
import { selectBacklinkPages, selectBacklinks } from "./backlinks.selectors.ts";

const plan = toBlockId("plan");
const mention = { kind: "page" as const, pageId: plan };

const page = (title: string, isTrashed = false) => ({
  title: [{ text: title }],
  icon: null,
  isFavorite: false,
  isTrashed,
});

function stateWith(mentioning: { readonly text: unknown[] }) {
  const workspace = buildWorkspace([
    { id: "plan", props: page("Plan") },
    {
      id: "notes",
      props: page("Notes"),
      children: [
        { id: "m", type: "paragraph", props: mentioning },
        { id: "link", type: "page-link", props: { pageId: "plan" } },
      ],
    },
    {
      id: "gone",
      props: page("Gone", true),
      children: [{ id: "g", type: "page-link", props: { pageId: "plan" } }],
    },
  ]);
  return { ...createInitialState(), workspace };
}

const titles = (text: unknown[]) =>
  selectBacklinkPages(stateWith({ text }), plan).map((item) => item.title);

describe("backlinks", () => {
  it("lists each page that links here once, leaving out the trash", () => {
    expect(titles([{ text: "see", mention }])).toEqual(["Notes"]);
  });

  it("follows mentions as they are added and removed", () => {
    const count = (text: unknown[]) =>
      selectBacklinks(stateWith({ text }), plan).filter((id) => id === "m")
        .length;

    expect(count([{ text: "see", mention }])).toBe(1);
    expect(count([{ text: "see" }])).toBe(0);
  });

  it("finds the blocks that mention or link to a page", () => {
    const ids = selectBacklinks(
      stateWith({ text: [{ text: "x", mention }] }),
      plan,
    );

    expect(ids).toEqual(expect.arrayContaining(["m", "link"]));
  });
});
