// A web bookmark's preview, as Notion shows it (ADR-0013): the page's
// title, description, image and icon, read by the server from the page's
// own tags, since a browser may not read another site.
import * as v from "valibot";
import { answer, type RouteTable } from "./api.ts";
import { sessionUser } from "./sessions.ts";

const MAX_BYTES = 512_000;
const askSchema = v.object({ url: v.pipe(v.string(), v.url()) });

// Hosts on this machine or its network are not fetched for anyone.
const PRIVATE_HOST =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1\]?$|169\.254\.)/i;

export function isFetchable(url: URL): boolean {
  return (
    (url.protocol === "http:" || url.protocol === "https:") &&
    !PRIVATE_HOST.test(url.hostname)
  );
}

const decode = (text: string) =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

// The content of a meta tag named by property or name, either order.
function metaOf(html: string, key: string): string | undefined {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const name = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (name?.toLowerCase() !== key) continue;
    const content = /content\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
    if (content !== undefined) return decode(content);
  }
  return undefined;
}

function iconOf(html: string, base: URL): string {
  const link = (html.match(/<link\b[^>]*>/gi) ?? []).find((tag) =>
    /rel\s*=\s*["'][^"']*icon[^"']*["']/i.test(tag),
  );
  const href =
    link === undefined
      ? undefined
      : /href\s*=\s*["']([^"']+)["']/i.exec(link)?.[1];
  return new URL(href ?? "/favicon.ico", base).href;
}

function absolute(value: string | undefined, base: URL): string | null {
  if (value === undefined || value === "") return null;
  const url = URL.parse(value, base);
  return url?.protocol === "https:" ? url.href : null;
}

export function previewOf(html: string, base: URL) {
  const title =
    metaOf(html, "og:title") ??
    decode(/<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] ?? "");
  return {
    title: title === "" ? base.hostname : title,
    description:
      metaOf(html, "og:description") ?? metaOf(html, "description") ?? "",
    image: absolute(metaOf(html, "og:image"), base),
    icon: absolute(iconOf(html, base), base),
  };
}

async function fetchPage(url: URL): Promise<string | undefined> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Pagecraft link preview", Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return undefined;
    const text = await response.text();
    return text.slice(0, MAX_BYTES);
  } catch {
    return undefined;
  }
}

export const LINK_PREVIEW_ROUTES: RouteTable = {
  "POST /api/link-preview": async (request, context) => {
    if (sessionUser(context, request) === undefined) {
      return answer(401, { error: "signed-out" });
    }
    const url = new URL(v.parse(askSchema, request.body).url);
    if (!isFetchable(url)) return answer(400, { error: "not-fetchable" });
    const html = await fetchPage(url);
    if (html === undefined) return answer(502, { error: "unreachable" });
    return answer(200, previewOf(html, url));
  },
};
