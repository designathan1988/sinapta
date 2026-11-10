import "../styles/index.css";
import { startApp } from "./bootstrap.ts";

const container = document.querySelector<HTMLElement>("[data-app-root]");
if (container === null) throw new Error("The app root element is missing.");
startApp(container);
