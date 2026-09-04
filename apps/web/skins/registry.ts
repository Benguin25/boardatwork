import type { SkinPrimitives } from "@/components/primitives/types";
import { playSkin } from "./play";
import { docsSkin } from "./docs";
import { sheetsSkin } from "./sheets";
import { slidesSkin } from "./slides";
import { slackSkin } from "./slack";
import { jiraSkin } from "./jira";
import { outlookSkin } from "./outlook";
import { notionSkin } from "./notion";
import { terminalSkin } from "./terminal";

export const SKIN_IDS = [
  "play",
  "docs",
  "sheets",
  "slides",
  "slack",
  "jira",
  "outlook",
  "notion",
  "terminal",
] as const;

export type SkinId = (typeof SKIN_IDS)[number];

export const skinRegistry: Record<SkinId, SkinPrimitives> = {
  play: playSkin,
  docs: docsSkin,
  sheets: sheetsSkin,
  slides: slidesSkin,
  slack: slackSkin,
  jira: jiraSkin,
  outlook: outlookSkin,
  notion: notionSkin,
  terminal: terminalSkin,
};

export function getSkin(id: string): SkinPrimitives {
  return skinRegistry[(id in skinRegistry ? id : "play") as SkinId];
}
