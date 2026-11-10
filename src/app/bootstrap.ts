// The composition root: creates the one store, registers every command and
// owns the single root render.
import { render } from "lit-html";
import type { Theme } from "../model/index.ts";
import {
  createAppStore,
  createCommandRegistry,
  createDispatcher,
  createInitialState,
  persistenceCommands,
  selectTheme,
  settingsCommands,
  uiCommands,
} from "../state/index.ts";
import { renderShell } from "./shell.view.ts";

const COMMANDS = [...uiCommands, ...settingsCommands, ...persistenceCommands];

// A manual theme is an attribute on the root element; "system" removes it.
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (theme === "system") root.removeAttribute("data-theme");
  else root.dataset.theme = theme;
  meta?.setAttribute("content", theme === "system" ? "light dark" : theme);
}

export function startApp(container: HTMLElement): void {
  const store = createAppStore(createInitialState());
  const dispatch = createDispatcher({
    store,
    registry: createCommandRegistry(COMMANDS),
  });
  const renderRoot = (): void => {
    const state = store.getState();
    applyTheme(selectTheme(state));
    render(renderShell(state, dispatch), container);
  };
  store.subscribe(renderRoot);
  renderRoot();
}
