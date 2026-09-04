"use client";

import { use, useReducer, useState } from "react";
import { placeholderGame, type PlaceholderMove } from "@/games/_dev-placeholder";
import { getSkin } from "@/skins/registry";

/**
 * Internal, unlinked route used only to smoke-test a skin against every
 * `SkinPrimitives` component and its cover state (Gate 2). Not part of the
 * shipped app; exercised by `tests/e2e/skins.spec.ts`.
 */
export default function SkinPreviewPage({
  params,
}: {
  params: Promise<{ skin: string }>;
}): React.ReactElement {
  const { skin: skinId } = use(params);
  const skin = getSkin(skinId);
  const puzzle = placeholderGame.generate(1, "medium");
  const [state, dispatch] = useReducer(
    (s: ReturnType<typeof placeholderGame.init>, move: PlaceholderMove) =>
      placeholderGame.reduce(s, move),
    puzzle,
    placeholderGame.init,
  );
  const [covered, setCovered] = useState(false);

  if (covered) {
    return (
      <skin.Cover
        onExit={() => {
          setCovered(false);
        }}
      />
    );
  }

  return (
    <skin.Chrome
      title="Placeholder"
      subtitle="#0"
      meta="Skin preview"
      nav={[{ id: "how-to-play", label: "How to play", onClick: () => undefined }]}
      onTitleClick={() => {
        setCovered(true);
      }}
      onChangeDisguise={() => undefined}
    >
      {placeholderGame.render(state, dispatch, skin)}
    </skin.Chrome>
  );
}
