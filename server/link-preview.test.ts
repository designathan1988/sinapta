import { describe, expect, it } from "vitest";
import { previewOf } from "./link-preview.ts";
import { createTestServer } from "./test-context.ts";

const PAGE = `<html><head>
<title>Fallback</title>
<meta property="og:title" content="Launch &amp; ship">
<meta name="description" content="Everything about the launch.">
<meta content="/cover.png" property="og:image">
<link rel="icon" href="/favicon.png">
</head></html>`;

describe("previewOf", () => {
  it("reads a page's title, description, image and icon from its tags", () => {
    expect(previewOf(PAGE, new URL("https://example.com/post"))).toEqual({
      title: "Launch & ship",
      description: "Everything about the launch.",
      image: "https://example.com/cover.png",
      icon: "https://example.com/favicon.png",
    });
  });

  it("falls back on the title tag, then on the host", () => {
    const base = new URL("https://example.com/");
    expect(previewOf("<title>Only a title</title>", base).title).toBe(
      "Only a title",
    );
    expect(previewOf("<p>nothing</p>", base).title).toBe("example.com");
  });
});

describe("POST /api/link-preview", () => {
  it("answers no one signed out", async () => {
    const server = createTestServer();

    const asked = await server.call("POST /api/link-preview", {
      url: "https://example.com/",
    });

    expect(asked.status).toBe(401);
  });

  it.each([
    "http://localhost:5190/",
    "http://127.0.0.1/admin",
    "http://2130706433/",
    "http://10.0.0.8/",
    "http://192.168.1.1/",
    "http://172.20.0.1/",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/",
    "ftp://example.com/file",
  ])("fetches nothing on this machine or its network: %s", async (url) => {
    const server = createTestServer();
    const signUp = await server.call("POST /api/account/sign-up", {
      email: "ada@pagecraft.test",
      password: "long enough",
      name: "Ada",
    });

    const asked = await server.call(
      "POST /api/link-preview",
      { url },
      signUp.cookies?.[0],
    );

    expect(asked).toMatchObject({
      status: 400,
      body: { error: "not-fetchable" },
    });
  });
});
