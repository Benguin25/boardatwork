import type { SkinPrimitives } from "@/components/primitives/types";
import { DISGUISE_IDS, type DisguiseId } from "@/lib/disguises";
import { playSkin } from "./play";
import { docsSkin } from "./docs";
import { sheetsSkin } from "./sheets";
import { slidesSkin } from "./slides";
import { slackSkin } from "./slack";
import { jiraSkin } from "./jira";
import { outlookSkin } from "./outlook";
import { notionSkin } from "./notion";
import { terminalSkin } from "./terminal";

/** The eight Work-mode disguises, keyed by the ids in `lib/disguises.ts`. */
export const disguiseRegistry: Record<DisguiseId, SkinPrimitives> = {
  docs: docsSkin,
  sheets: sheetsSkin,
  slides: slidesSkin,
  slack: slackSkin,
  jira: jiraSkin,
  outlook: outlookSkin,
  notion: notionSkin,
  terminal: terminalSkin,
};

export function getDisguise(id: DisguiseId): SkinPrimitives {
  return disguiseRegistry[id];
}

export { playSkin };

/** Play plus every disguise — the `/dev/skins/[skin]` harness and tests. */
export const SKIN_IDS = ["play", ...DISGUISE_IDS] as const;

export type SkinId = (typeof SKIN_IDS)[number];

export function getSkin(id: string): SkinPrimitives {
  if (id === "play") {
    return playSkin;
  }
  return disguiseRegistry[id as DisguiseId] ?? playSkin;
}
