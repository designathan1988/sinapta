// The hosts whose pages can be embedded, and how each turns an address
// people paste into the address its player or viewer lives at. The
// content security policy in vite.config.ts lists exactly the hosts in
// FRAME_HOSTS.
import { TOOL_FRAME_HOSTS, toolRuleOf, type Rule } from "./embed-tools.ts";

function segments(url: URL): string[] {
  return url.pathname.split("/").filter((part) => part !== "");
}

const YOUTUBE_EMBED = "https://www.youtube-nocookie.com/embed/";

const youtube: Rule = (url) => {
  const [first, second] = segments(url);
  if (url.hostname === "youtu.be") return first && `${YOUTUBE_EMBED}${first}`;
  const id =
    first === "watch"
      ? url.searchParams.get("v")
      : first === "shorts" || first === "embed"
        ? second
        : undefined;
  return id ? `${YOUTUBE_EMBED}${id}` : undefined;
};

const vimeo: Rule = (url) => {
  const id = segments(url).find((part) => /^\d+$/.test(part));
  return id && `https://player.vimeo.com/video/${id}`;
};

const loom: Rule = (url) => {
  const [kind, id] = segments(url);
  return kind === "share" && id
    ? `https://www.loom.com/embed/${id}`
    : undefined;
};

const spotify: Rule = (url) => {
  const [kind, id] = segments(url).filter((part) => part !== "embed");
  const kinds = ["track", "album", "playlist", "episode", "show", "artist"];
  return kind && id && kinds.includes(kind)
    ? `https://open.spotify.com/embed/${kind}/${id}`
    : undefined;
};

const codepen: Rule = (url) => {
  const [user, kind, id] = segments(url);
  return user && kind === "pen" && id
    ? `https://codepen.io/${user}/embed/${id}?default-tab=result`
    : undefined;
};

const tweet: Rule = (url) => {
  const [, kind, id] = segments(url);
  return kind === "status" && id && /^\d+$/.test(id)
    ? `https://platform.twitter.com/embed/Tweet.html?id=${id}`
    : undefined;
};

const googleDocs: Rule = (url) => {
  const [kind, d, id] = segments(url);
  const views: Record<string, string> = {
    document: "preview",
    spreadsheets: "preview",
    presentation: "embed",
  };
  if (kind === undefined || d !== "d" || id === undefined) return undefined;
  const view = views[kind];
  return view && `https://docs.google.com/${kind}/d/${id}/${view}`;
};

const googleMaps: Rule = (url) => {
  if (!url.pathname.startsWith("/maps")) return undefined;
  if (url.pathname.startsWith("/maps/embed")) return url.href;
  const query = encodeURIComponent(url.href);
  return `https://www.google.com/maps?output=embed&q=${query}`;
};

const figma: Rule = (url) => {
  const [kind] = segments(url);
  const kinds = ["file", "design", "proto", "board"];
  return kind && kinds.includes(kind)
    ? `https://www.figma.com/embed?embed_host=pagecraft&url=${encodeURIComponent(url.href)}`
    : undefined;
};

const soundcloud: Rule = (url) =>
  segments(url).length >= 2
    ? `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.href)}`
    : undefined;

const RULES: ReadonlyMap<string, Rule> = new Map([
  ["youtube.com", youtube],
  ["www.youtube.com", youtube],
  ["m.youtube.com", youtube],
  ["youtu.be", youtube],
  ["vimeo.com", vimeo],
  ["player.vimeo.com", vimeo],
  ["www.loom.com", loom],
  ["loom.com", loom],
  ["open.spotify.com", spotify],
  ["codepen.io", codepen],
  ["twitter.com", tweet],
  ["x.com", tweet],
  ["docs.google.com", googleDocs],
  ["www.google.com", googleMaps],
  ["google.com", googleMaps],
  ["www.figma.com", figma],
  ["figma.com", figma],
  ["soundcloud.com", soundcloud],
]);

// The hosts embed frames load from.
export const FRAME_HOSTS = [
  "https://www.youtube-nocookie.com",
  "https://player.vimeo.com",
  "https://www.loom.com",
  "https://open.spotify.com",
  "https://codepen.io",
  "https://platform.twitter.com",
  "https://docs.google.com",
  "https://www.google.com",
  "https://www.figma.com",
  "https://w.soundcloud.com",
  ...TOOL_FRAME_HOSTS,
] as const;

// The address to frame for a pasted https address, or undefined for an
// address of a host that is not on the list.
export function toEmbedUrl(address: string): string | undefined {
  const url = URL.parse(address.trim());
  if (url?.protocol !== "https:") return undefined;
  const rule = RULES.get(url.hostname) ?? toolRuleOf(url.hostname);
  return rule?.(url);
}
