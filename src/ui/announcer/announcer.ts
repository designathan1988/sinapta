// Speaks short messages to assistive technology through the page's one
// polite live region, which sits in index.html outside the rendered app.
export function announce(message: string): void {
  const region = document.querySelector("[data-announcer]");
  if (region !== null) region.textContent = message;
}
