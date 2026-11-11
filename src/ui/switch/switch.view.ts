// The look of a switch. The control that holds it, such as a menu item
// with the role menuitemcheckbox, carries its state for assistive tools.
import "./switch.css";
import { html, type TemplateResult } from "lit-html";

export function renderSwitchMark(isOn: boolean): TemplateResult {
  return html`<span class="switch" ?data-on=${isOn} aria-hidden="true"></span>`;
}
