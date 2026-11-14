// Speaks short messages to assistive technology through the page's one
// polite live region, which sits in index.html outside the rendered app.

// A no-break space, added to the same words said twice in a row: the
// region then changes, so the second move is heard as the first was.
const MARK = " ";

export function announce(message: string): void {
  const region = document.querySelector("[data-announcer]");
  if (region === null) return;
  const said = region.textContent;
  region.textContent = said === message ? `${message}${MARK}` : message;
}
