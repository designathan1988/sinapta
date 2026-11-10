// Creates the store that holds AppState. The app creates exactly one, in
// src/app/bootstrap.ts; tests create their own.
import { createStore, type StoreApi } from "zustand/vanilla";
import type { AppState } from "./app-state.ts";

export type AppStore = StoreApi<AppState>;

export function createAppStore(initialState: AppState): AppStore {
  return createStore<AppState>()(() => initialState);
}
