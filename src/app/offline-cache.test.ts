import { describe, expect, it } from "vitest";
import {
  cacheNameOf,
  filesToKeep,
  oldCaches,
  servingOf,
} from "./offline-cache.ts";

const ORIGIN = "https://pagecraft.test";

function request(path: string, mode = "cors", method = "GET") {
  return { url: `${ORIGIN}${path}`, mode, method };
}

describe("the offline cache", () => {
  it("is named by the build, so a new build fills a new cache", () => {
    expect(cacheNameOf("a1b2")).toBe("pagecraft-a1b2");
  });

  it("keeps the app shell and every built file", () => {
    expect(
      filesToKeep("assets/index-1.js,assets/index-2.css,manifest.webmanifest"),
    ).toEqual([
      "/",
      "/assets/index-1.js",
      "/assets/index-2.css",
      "/manifest.webmanifest",
    ]);
    expect(filesToKeep("")).toEqual(["/"]);
  });

  it("drops the caches of earlier builds, and only its own", () => {
    expect(
      oldCaches(["pagecraft-old", "pagecraft-new", "other"], "pagecraft-new"),
    ).toEqual(["pagecraft-old"]);
  });

  it("serves a page from the app shell and a file from the cache first", () => {
    expect(servingOf(request("/", "navigate"), ORIGIN)).toBe("shell");
    expect(servingOf(request("/#/page/x", "navigate"), ORIGIN)).toBe("shell");
    expect(servingOf(request("/assets/index-1.js"), ORIGIN)).toBe("file");
  });

  it("leaves other sites, other methods and itself to the network", () => {
    expect(
      servingOf(
        { ...request("/a.png"), url: "https://img.test/a.png" },
        ORIGIN,
      ),
    ).toBe("network");
    expect(servingOf(request("/x", "cors", "POST"), ORIGIN)).toBe("network");
    expect(servingOf(request("/service-worker.js"), ORIGIN)).toBe("network");
  });
});
