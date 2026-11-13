// Skin tones, as Notion's picker draws people: the tone's modifier goes
// right after an emoji that takes one, in place of its emoji style mark.
import type { SkinTone } from "../../model/index.ts";

const MODIFIERS: Readonly<Record<SkinTone, string>> = {
  default: "",
  light: "\u{1F3FB}",
  "medium-light": "\u{1F3FC}",
  medium: "\u{1F3FD}",
  "medium-dark": "\u{1F3FE}",
  dark: "\u{1F3FF}",
};

const TAKES_TONE = /^\p{Emoji_Modifier_Base}️?/u;

export function withSkinTone(emoji: string, tone: SkinTone): string {
  const modifier = MODIFIERS[tone];
  const base = TAKES_TONE.exec(emoji)?.[0];
  if (modifier === "" || base === undefined) return emoji;
  const first = base.replace("️", "");
  return first + modifier + emoji.slice(base.length);
}
