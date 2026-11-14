import "../styles/index.css";
import { startApp } from "./bootstrap.ts";
import { publicAddressOf, startPublicPage } from "./public-page.ts";

const container = document.querySelector<HTMLElement>("[data-app-root]");
if (container === null) throw new Error("The app root element is missing.");
// A published page is shown alone; any other address opens the app.
const published = publicAddressOf(location.pathname);
void (published === undefined
  ? startApp(container)
  : startPublicPage(container, published));
