import { Chit, ChitRenderSpec } from "@pretty-chitty/core";
import { PLAYER_COLORS, SIZE } from "../consts";
import { disc, galleryFit, outlineFor, piece, wood } from "../render";

/** An action marker (C3): a wooden cylinder in a player's colour. Placed on an action space it is spent
 *  for the game (SP4). */
export class ActionMarker extends Chit {
  colorIndex = 0;

  render(spec: ChitRenderSpec): void {
    piece(spec, "marker");
    const hex = PLAYER_COLORS[this.colorIndex].hex;
    spec.object = disc(SIZE.actionMarkerR, SIZE.actionMarkerH, wood(hex), wood(hex), 32);
    spec.highlight.color = outlineFor(hex); // reads on the dark action spaces and against its neighbours
    galleryFit(spec, 1, 1, 120);
    if (this.parentOutlet === "ends") {
      // LE16: beside the crossing it marks, clear of the roads' ends (crossing kinds have fixed radii)
      const kind = (this.parent as any)?.kind as string | undefined;
      const r = (kind === "station" ? SIZE.stationR : kind === "roundabout" ? SIZE.roundaboutR : SIZE.plainCrossingR) + 0.3;
      const t = Math.PI / 4 + (this.parentOutletIndex ?? 0) * 0.7;
      spec.offsetX = r * Math.cos(t);
      spec.offsetY = r * Math.sin(t);
      spec.offsetZ = -SIZE.crossingThickness; // down on the board beside the crossing, not on its top
    } else if (this.parentOutlet === "markers") {
      // the player's supply: a tidy block of cylinders
      spec.splay.enabled = true;
      spec.splay.rows = 4;
      spec.splay.columns = 5;
      spec.splay.spacingMultiplier = 1.12;
    }
    spec.summary =
      this.parentOutlet === "ends"
        ? `**An end of ${PLAYER_COLORS[this.colorIndex].name}'s line**\n\nThe line loops back on itself here, so this spent action marker shows that one of its ends is at this crossing. It goes back to the box once that end has moved on.`
        : `**Action marker** (${PLAYER_COLORS[this.colorIndex].name})\n\nEach one chooses one action, and is then out of the game.`;
    spec.showDetailsOnLongPress = true;
  }
}
