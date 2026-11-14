// Notion AI's state (ADR-0013): the question asked about a block, and the
// answer shown under it with Insert below, Replace and Discard.
import type { AppState } from "./app-state.ts";
import {
  defineCommand,
  type CommandEffect,
  type NoPayload,
} from "./command-registry.ts";

export type AiAction =
  | "improve"
  | "fix"
  | "shorter"
  | "longer"
  | "summarize"
  | "action-items"
  | "translate"
  | "explain"
  | "continue";

export interface AiState {
  readonly status: "idle" | "thinking" | "answered" | "failed";
  readonly blockId: string | null;
  readonly action: AiAction | null;
  // The block's text the question is about.
  readonly text: string;
  readonly answer: string;
  readonly error: "model-missing" | "network" | null;
  readonly requestCount: number;
}

export const AI_IDLE: AiState = {
  status: "idle",
  blockId: null,
  action: null,
  text: "",
  answer: "",
  error: null,
  requestCount: 0,
};

function withAi(state: AppState, change: Partial<AiState>): CommandEffect {
  const ai = { ...state.persistence.ai, ...change };
  return { persistence: { ...state.persistence, ai } };
}

export const askAi = defineCommand<{
  blockId: string;
  action: AiAction;
  text: string;
}>({
  type: "ai.ask",
  handle: (state, { blockId, action, text }) =>
    withAi(state, {
      status: "thinking",
      blockId,
      action,
      text,
      answer: "",
      error: null,
      requestCount: state.persistence.ai.requestCount + 1,
    }),
});

export const answerAi = defineCommand<{
  answer: string | null;
  error: "model-missing" | "network" | null;
}>({
  type: "ai.answer",
  handle: (state, { answer, error }) =>
    withAi(state, {
      status: answer === null ? "failed" : "answered",
      answer: answer ?? "",
      error,
    }),
});

export const discardAi = defineCommand<NoPayload>({
  type: "ai.discard",
  handle: (state) =>
    withAi(state, {
      ...AI_IDLE,
      requestCount: state.persistence.ai.requestCount,
    }),
});

export const aiCommands = [askAi, answerAi, discardAi];
