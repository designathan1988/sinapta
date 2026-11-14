import { describe, expect, it } from "vitest";
import { buildWorkspace, TEST_TIME, toBlockId } from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import { pageVerifyCommands, setPageVerified } from "./page-verify.ts";

const PAGE = toBlockId("wiki");

function app() {
  const props = { title: [], icon: null, isFavorite: false, isTrashed: false };
  const workspace = buildWorkspace([{ id: "wiki", props }]);
  const made = createTestApp({ workspace, commands: pageVerifyCommands });
  const verification = () =>
    made.store.getState().workspace.blocks[PAGE]?.props.verification;
  return { ...made, verification };
}

describe("page.setVerified", () => {
  it("verifies a page for a number of days, as Notion's Verify", () => {
    const { dispatch, verification } = app();

    dispatch(setPageVerified.create({ pageId: PAGE, days: 7 }));

    expect(verification()).toEqual({
      by: "You",
      at: TEST_TIME,
      until: "2026-11-17T12:00:00.000Z",
    });
  });

  it("verifies with no end, and removes the verification", () => {
    const { dispatch, verification } = app();

    dispatch(setPageVerified.create({ pageId: PAGE, days: null }));
    expect(verification()).toMatchObject({ until: null });

    dispatch(setPageVerified.create({ pageId: PAGE, days: "off" }));
    expect(verification()).toBeUndefined();
  });
});
