// Embeds of work tools Notion frames as well: GitHub Gist, Miro,
// CodeSandbox, Typeform, Google Drive, Excalidraw, Whimsical and Airtable.
export type Rule = (url: URL) => string | undefined;

function segments(url: URL): string[] {
  return url.pathname.split("/").filter((part) => part !== "");
}

// A Gist's page as plain HTML, which a frame can show.
const gist: Rule = (url) => {
  const [user, id] = segments(url);
  return user && id ? `https://gist.github.com/${user}/${id}.pibb` : undefined;
};

const miro: Rule = (url) => {
  const [app, board, id] = segments(url);
  return app === "app" && board === "board" && id
    ? `https://miro.com/app/live-embed/${id}/`
    : undefined;
};

const codesandbox: Rule = (url) => {
  const parts = segments(url);
  const id = parts.at(-1);
  const kinds = ["s", "p", "embed"];
  return id && parts[0] !== undefined && kinds.includes(parts[0])
    ? `https://codesandbox.io/embed/${id}`
    : undefined;
};

const typeform: Rule = (url) => {
  const [to, id] = segments(url);
  return to === "to" && id ? `https://form.typeform.com/to/${id}` : undefined;
};

const googleDrive: Rule = (url) => {
  const [file, d, id] = segments(url);
  return file === "file" && d === "d" && id
    ? `https://drive.google.com/file/d/${id}/preview`
    : undefined;
};

// A shared Excalidraw scene lives in the address's fragment.
const excalidraw: Rule = (url) =>
  url.hash.startsWith("#json=") || url.hash.startsWith("#room=")
    ? `https://excalidraw.com/${url.hash}`
    : undefined;

const whimsical: Rule = (url) => {
  const [first, second] = segments(url);
  const slug = first === "embed" ? second : first;
  return slug ? `https://whimsical.com/embed/${slug}` : undefined;
};

const airtable: Rule = (url) => {
  const parts = segments(url).filter((part) => part !== "embed");
  const shared = parts.findIndex((part) => part.startsWith("shr"));
  return shared === -1
    ? undefined
    : `https://airtable.com/embed/${parts.slice(0, shared + 1).join("/")}`;
};

export const TOOL_RULES: ReadonlyMap<string, Rule> = new Map([
  ["gist.github.com", gist],
  ["miro.com", miro],
  ["codesandbox.io", codesandbox],
  ["form.typeform.com", typeform],
  ["drive.google.com", googleDrive],
  ["excalidraw.com", excalidraw],
  ["whimsical.com", whimsical],
  ["airtable.com", airtable],
]);

// Typeform forms live on each account's own subdomain.
export function toolRuleOf(hostname: string): Rule | undefined {
  if (hostname.endsWith(".typeform.com")) return typeform;
  return TOOL_RULES.get(hostname);
}

export const TOOL_FRAME_HOSTS = [
  "https://gist.github.com",
  "https://miro.com",
  "https://codesandbox.io",
  "https://form.typeform.com",
  "https://drive.google.com",
  "https://excalidraw.com",
  "https://whimsical.com",
  "https://airtable.com",
] as const;
