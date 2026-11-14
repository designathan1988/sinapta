// Reading a request and writing a response: the only place the server
// touches node:http's objects.
import type { IncomingMessage, ServerResponse } from "node:http";

const MAX_BODY = 64 * 1024 * 1024;

export interface ApiRequest {
  readonly method: string;
  readonly path: string;
  readonly query: URLSearchParams;
  readonly cookies: ReadonlyMap<string, string>;
  // The request came from the server's own page: its Origin, when it has
  // one, names the host it was sent to.
  readonly sameOrigin: boolean;
  readonly body: unknown;
  // The parts of the path a route names with ":", as ":id".
  readonly params: Readonly<Record<string, string>>;
}

// A response that stays open and sends events (Server-Sent Events): the
// route sends, may end it, and is told when the client leaves.
export interface EventStream {
  readonly start: (
    send: (event: string, data: unknown) => void,
    end: () => void,
  ) => () => void;
}

export interface ApiResponse {
  readonly status: number;
  readonly body?: unknown;
  readonly cookies?: readonly string[];
  readonly stream?: EventStream;
}

function parseCookies(header: string | undefined): Map<string, string> {
  const cookies = new Map<string, string>();
  for (const part of (header ?? "").split(";")) {
    const at = part.indexOf("=");
    if (at < 1) continue;
    const name = part.slice(0, at).trim();
    cookies.set(name, decodeURIComponent(part.slice(at + 1).trim()));
  }
  return cookies;
}

function isSameOrigin(request: IncomingMessage): boolean {
  const origin = request.headers.origin;
  if (origin === undefined) return true;
  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}

async function readText(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    size += buffer.length;
    if (size > MAX_BODY) throw new RangeError("body too large");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

// The body as JSON when it has one; schemas then give it a type.
async function readBody(request: IncomingMessage): Promise<unknown> {
  const text = await readText(request);
  if (text === "") return undefined;
  const value: unknown = JSON.parse(text);
  return value;
}

export async function readRequest(
  request: IncomingMessage,
): Promise<ApiRequest> {
  const url = new URL(request.url ?? "/", "http://pagecraft.local");
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  return {
    method: request.method ?? "GET",
    path: url.pathname,
    query: url.searchParams,
    cookies: parseCookies(request.headers.cookie),
    sameOrigin: isSameOrigin(request),
    body: hasBody ? await readBody(request) : undefined,
    params: {},
  };
}

function writeStream(response: ServerResponse, stream: EventStream): void {
  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store",
    Connection: "keep-alive",
  });
  const END = "\n\n";
  response.write(`: open${END}`);
  const stop = stream.start(
    (event, data) => {
      response.write(`event: ${event}\ndata: ${JSON.stringify(data)}${END}`);
    },
    () => {
      response.end();
    },
  );
  response.on("close", stop);
}

export function writeResponse(
  response: ServerResponse,
  result: ApiResponse,
): void {
  if (result.stream !== undefined) {
    writeStream(response, result.stream);
    return;
  }
  response.statusCode = result.status;
  response.setHeader("Cache-Control", "no-store");
  if (result.cookies !== undefined && result.cookies.length > 0) {
    response.setHeader("Set-Cookie", [...result.cookies]);
  }
  if (result.body === undefined) {
    response.end();
    return;
  }
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(result.body));
}
