// Notion AI's state (ADR-0013): the question asked about a block, and the
// answer shown under it with Insert below, Replace and Discard.
import type { AppState } from "./app-state.ts";
import {
  defineCommand,
  type CommandEffect,
  type NoPayload,
} from "./command-registry.ts";

export type AiAction =
  | "ask"
  | "improve"
  | "fix"
  | "shorter"
  | "longer"
  | "summarize"
  | "action-items"
  | "translate"
  | "explain"
  | "continue";

export interface ChatMessage {
  readonly from: "you" | "ai" | "failed";
  readonly text: string;
}

export interface AiState {
  readonly status: "idle" | "thinking" | "answered" | "failed";
  // The block the question is about; null for the AI chat.
  readonly blockId: string | null;
  readonly action: AiAction | null;
  // The block's text the question is about.
  readonly text: string;
  readonly answer: string;
  readonly error: "model-missing" | "network" | null;
  readonly requestCount: number;
  // The AI chat's conversation, oldest first.
  readonly chat: readonly ChatMessage[];
}

export const AI_IDLE: AiState = {
  status: "idle",
  blockId: null,
  action: null,
  text: "",
  answer: "",
  error: null,
  requestCount: 0,
  chat: [],
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
    state.persistence.ai.blockId === null
      ? chatAnswer(state, answer, error)
      : withAi(state, {
          status: answer === null ? "failed" : "answered",
          answer: answer ?? "",
          error,
        }),
});

// The next words of an answer being written; the answer is complete when
// "ai.answer" records it.
export const answerAiPart = defineCommand<{ part: string }>({
  type: "ai.answerPart",
  handle: (state, { part }) => {
    const { ai } = state.persistence;
    if (ai.status !== "thinking") return {};
    return withAi(state, { answer: ai.answer + part });
  },
});

function chatAnswer(
  state: AppState,
  answer: string | null,
  error: AiState["error"],
): CommandEffect {
  const message: ChatMessage =
    answer === null
      ? { from: "failed", text: error ?? "network" }
      : { from: "ai", text: answer };
  return withAi(state, {
    status: "idle",
    chat: [...state.persistence.ai.chat, message],
  });
}

// A message of the AI chat: kept in the conversation, then asked.
export const sendChat = defineCommand<{ text: string }>({
  type: "ai.sendChat",
  handle: (state, { text }) => {
    const { ai } = state.persistence;
    if (text.trim() === "" || ai.status === "thinking") return {};
    return withAi(state, {
      status: "thinking",
      blockId: null,
      action: "ask",
      text,
      answer: "",
      chat: [...ai.chat, { from: "you", text }],
      requestCount: ai.requestCount + 1,
    });
  },
});

export const discardAi = defineCommand<NoPayload>({
  type: "ai.discard",
  handle: (state) =>
    withAi(state, {
      ...AI_IDLE,
      requestCount: state.persistence.ai.requestCount,
      chat: state.persistence.ai.chat,
    }),
});

export const aiCommands = [askAi, answerAi, answerAiPart, discardAi, sendChat];
