import { describe, expect, it } from "vitest";
import { appOfLink, appSpec, needsAddress } from "./app-connection.ts";

describe("appOfLink", () => {
  it.each([
    ["https://github.com/acme/site/pull/12", "github"],
    ["https://www.figma.com/file/abc/Design", "figma"],
    ["https://acme.atlassian.net/browse/OPS-4", "jira"],
    ["https://docs.google.com/document/d/1", "google-drive"],
    ["https://app.asana.com/0/1/2", "asana"],
  ])("knows %s is %s's", (href, app) => {
    expect(appOfLink(href)?.id).toBe(app);
  });

  it("knows no app of other links, nor of a look-alike host", () => {
    expect(appOfLink("https://example.com/")).toBeUndefined();
    expect(appOfLink("https://notgithub.com/x")).toBeUndefined();
    expect(appOfLink("not a link")).toBeUndefined();
  });
});

describe("needsAddress", () => {
  it("asks an address of a channel or a calendar only", () => {
    const of = (id: string) => {
      const spec = appSpec(id);
      return spec !== undefined && needsAddress(spec);
    };

    expect([of("slack"), of("icloud"), of("gmail"), of("github")]).toEqual([
      true,
      true,
      false,
      false,
    ]);
  });
});
