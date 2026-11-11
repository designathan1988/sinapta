import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  toBlockId,
  type BlockSpec,
} from "../../model/index.ts";
import { createInitialState, createTestApp } from "../../state/index.ts";
import { pageCommands, renamePage } from "../page/index.ts";
import { selectBlockTrail } from "./breadcrumb.selectors.ts";

function page(id: string, title: string, children: BlockSpec[] = []) {
  return {
    id,
    props: {
      title: [{ text: title }],
      icon: null,
      isFavorite: false,
      isTrashed: false,
    },
    children,
  };
}

const workspace = buildWorkspace([
  page("home", "Home", [
    page("plan", "Plan", [{ id: "crumbs", type: "breadcrumb", props: {} }]),
  ]),
]);

describe("selectBlockTrail", () => {
  it("is the path to the page the block sits in", () => {
    const state = { ...createInitialState(), workspace };

    const titles = selectBlockTrail(state, toBlockId("crumbs")).map(
      (item) => item.title,
    );

    expect(titles).toEqual(["Home", "Plan"]);
  });

  it("follows a page's new name", () => {
    const app = createTestApp({ workspace, commands: pageCommands });
    app.dispatch(
      renamePage.create({ pageId: toBlockId("plan"), title: "Roadmap" }),
    );

    const titles = selectBlockTrail(
      app.store.getState(),
      toBlockId("crumbs"),
    ).map((item) => item.title);

    expect(titles).toEqual(["Home", "Roadmap"]);
  });
});
