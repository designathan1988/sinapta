// Tells the store whether the window is narrow, at the start and whenever
// that changes: under 768 px the sidebar becomes a drawer.
import { setNarrow, type Dispatch } from "../state/index.ts";

const NARROW_WINDOW = "(width < 48rem)";

export function watchViewport(dispatch: Dispatch): void {
  if (typeof matchMedia === "undefined") return;
  const query = matchMedia(NARROW_WINDOW);
  const tell = (): void => {
    dispatch(setNarrow.create({ isNarrow: query.matches }));
  };
  tell();
  query.addEventListener("change", tell);
}
