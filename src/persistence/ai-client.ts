// Asks the server's AI each question the store records, and records the
// answer (ADR-0013).
import { answerAi, type AppStore, type Dispatch } from "../state/index.ts";
import type { Fetch } from "./account-client.ts";
import { parseReply, readAiReply } from "./account.schema.ts";

async function ask(send: Fetch, body: unknown) {
  const response = await send("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  const answer = readAiReply(parseReply(await response.text()));
  if (answer !== undefined) return answerAi.create({ answer, error: null });
  const error = response.status === 503 ? "model-missing" : "network";
  return answerAi.create({ answer: null, error });
}

export function startAi(options: {
  readonly store: AppStore;
  readonly dispatch: Dispatch;
  readonly send?: Fetch;
}): void {
  const {
    store,
    dispatch,
    send = (input, init) => fetch(input, init),
  } = options;
  let asked = store.getState().persistence.ai.requestCount;
  store.subscribe((state) => {
    const { requestCount, status, action, text } = state.persistence.ai;
    if (requestCount === asked || status !== "thinking") return;
    asked = requestCount;
    void ask(send, { action, text }).then(
      (command) => dispatch(command),
      () => dispatch(answerAi.create({ answer: null, error: "network" })),
    );
  });
}
