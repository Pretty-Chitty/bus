import { Chit, ChitRenderSpec } from "@pretty-chitty/core";
import { PLAYER_COLORS, SIZE } from "../consts";
import { box, galleryFit, outlineFor, piece, wood } from "../render";

/** A line marker (C2): a wooden stick in a player's colour, lying along a street (drawn twice as wide as it is tall). */
export class LineMarker extends Chit {
  colorIndex = 0;

  render(spec: ChitRenderSpec): void {
    piece(spec, "stick");
    const hex = PLAYER_COLORS[this.colorIndex].hex;
    spec.object = box(SIZE.lineLength, SIZE.lineWidth, SIZE.lineSection, wood(hex));
    spec.highlight.color = outlineFor(hex);
    spec.highlight.childrenInheritOutline = true; // its own outline, not the road network's
    galleryFit(spec, 10, 1, 200);
    if (this.parentOutlet === "markers") {
      // several lines in one street lie side by side across it (LE7–LE10), by own index
      const i = this.parentOutletIndex ?? 0;
      const step = SIZE.lineWidth + 0.02;
      spec.offsetY = i === 0 ? 0 : (i % 2 === 1 ? 1 : -1) * Math.ceil(i / 2) * step;
    }
    spec.summary = `**Line marker** (${PLAYER_COLORS[this.colorIndex].name})\n\nOne street of that player's bus line. Lines are never removed.`;
    spec.showDetailsOnLongPress = true;
  }
}
