// Notion AI on the server (ADR-0013): a local Ollama model when one answers
// on 127.0.0.1:11434, and otherwise a provider without a model that does
// what plain text allows and says the model is missing for the rest.
import * as v from "valibot";
import { answer, type RouteTable } from "./api.ts";
import { sessionUser } from "./sessions.ts";

export const AI_ACTIONS = [
  "ask",
  "improve",
  "fix",
  "shorter",
  "longer",
  "summarize",
  "action-items",
  "translate",
  "explain",
  "continue",
] as const;
export type Action = (typeof AI_ACTIONS)[number];

const askSchema = v.object({
  action: v.picklist(AI_ACTIONS),
  text: v.pipe(v.string(), v.maxLength(20_000)),
});

const INSTRUCTIONS: Readonly<Record<Action, string>> = {
  ask: "Answer this request. Answer with the text to put in the page only.",
  improve: "Improve the writing of this text. Answer with the new text only.",
  fix: "Fix the spelling and grammar of this text. Answer with the fixed text only.",
  shorter: "Make this text shorter. Answer with the new text only.",
  longer:
    "Make this text longer, in the same voice. Answer with the new text only.",
  summarize: "Summarize this text in a few sentences.",
  "action-items":
    "List the action items in this text, one per line, each starting with '- '.",
  translate:
    "Translate this text to English. Answer with the translation only.",
  explain: "Explain this text simply.",
  continue: "Continue writing this text, in the same voice.",
};

const MODEL = process.env.PAGECRAFT_AI_MODEL ?? "llama3.2";
const OLLAMA = "http://127.0.0.1:11434/api/generate";

async function askOllama(
  action: Action,
  text: string,
): Promise<string | undefined> {
  try {
    const response = await fetch(OLLAMA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt: `${INSTRUCTIONS[action]}\n\n${text}`,
        stream: false,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) return undefined;
    const body = v.safeParse(
      v.object({ response: v.string() }),
      await response.json(),
    );
    return body.success ? body.output.response.trim() : undefined;
  } catch {
    return undefined;
  }
}

function sentencesOf(text: string): string[] {
  return (text.match(/[^.!?\n]+[.!?]*/g) ?? [])
    .map((s) => s.trim())
    .filter(Boolean);
}

const DUTY =
  /\b(should|must|need|needs|todo|to do|will|have to|please|follow up)\b/i;

// A free question that names what it wants, as "Summarize: …": the action
// it names and the text after the colon.
const NAMED: readonly (readonly [RegExp, Action])[] = [
  [/^s*summar/i, "summarize"],
  [/^s*(find |list )?(the )?(action items|to-?dos?|tasks)/i, "action-items"],
  [/^s*(make (it )?)?short/i, "shorter"],
];

function namedAction(text: string): [Action, string] | undefined {
  const colon = text.indexOf(":");
  if (colon < 0) return undefined;
  const found = NAMED.find(([pattern]) => pattern.test(text.slice(0, colon)));
  return found === undefined ? undefined : [found[1], text.slice(colon + 1)];
}

// What can be done without a model; undefined for the rest.
export function askLocally(action: Action, text: string): string | undefined {
  if (action === "ask") {
    const named = namedAction(text);
    return named === undefined ? undefined : askLocally(named[0], named[1]);
  }
  const sentences = sentencesOf(text);
  switch (action) {
    case "summarize":
      return sentences.slice(0, 2).join(" ");
    case "shorter":
      return sentences
        .slice(0, Math.max(1, Math.ceil(sentences.length / 2)))
        .join(" ");
    case "action-items": {
      const duties = sentences.filter((sentence) => DUTY.test(sentence));
      return (duties.length > 0 ? duties : sentences.slice(0, 3))
        .map((sentence) => `- ${sentence}`)
        .join("\n");
    }
    default:
      return undefined;
  }
}

// The model's answer when one runs, else the plain-text one, else none.
export async function askAi(
  action: Action,
  text: string,
): Promise<string | undefined> {
  return (await askOllama(action, text)) ?? askLocally(action, text);
}

export const AI_ROUTES: RouteTable = {
  "POST /api/ai": async (request, context) => {
    if (sessionUser(context, request) === undefined) {
      return answer(401, { error: "signed-out" });
    }
    const { action, text } = v.parse(askSchema, request.body);
    const byModel = await askOllama(action, text);
    if (byModel !== undefined)
      return answer(200, { text: byModel, provider: "ollama" });
    const local = askLocally(action, text);
    return local === undefined
      ? answer(503, { error: "model-missing" })
      : answer(200, { text: local, provider: "local" });
  },
};
