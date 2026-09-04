"use client";

import { GamePageShell } from "@/components/shell/GamePageShell";
import { forecastGame } from "@/games/forecast";
import type { AnyGameModule } from "@/games/types";

/**
 * Internal, unlinked route that exercises Forecast end-to-end before
 * `games/registry.ts` (merged centrally, not edited by this game's own
 * task — see the Forecast task's "Registration" note) wires up the real
 * `/forecast` route. Not part of the shipped app; exercised by
 * `tests/e2e/forecast.spec.ts`, same spirit as `/dev/skins/[skin]` for
 * skins. Once registry.ts registers `forecastGame`, `/forecast` behaves
 * identically to this route and this file can be deleted.
 */
export default function ForecastDevPage(): React.ReactElement {
  return <GamePageShell game={forecastGame as unknown as AnyGameModule} source={{ kind: "daily" }} />;
}
