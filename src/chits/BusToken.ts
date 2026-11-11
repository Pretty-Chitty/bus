import { Chit, ChitRenderSpec } from "@pretty-chitty/core";
import { ExtrudeGeometry, Mesh, Shape } from "three";
import { PLAYER_COLORS, SIZE } from "../consts";
import { galleryFit, outlineFor, piece, wood } from "../render";

let geo: ExtrudeGeometry | undefined;
function busGeometry() {
  if (!geo) {
    const w = SIZE.busW,
      h = SIZE.busH,
      r = 0.08;
    const s = new Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    geo = new ExtrudeGeometry(s, { depth: SIZE.busZ, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 });
  }
  return geo;
}

/** A bus token (C4): a chunky wooden block in a player's colour. In the depot it is one of their buses (BU2). */
export class BusToken extends Chit {
  colorIndex = 0;

  render(spec: ChitRenderSpec): void {
    piece(spec);
    const hex = PLAYER_COLORS[this.colorIndex].hex;
    const m = new Mesh(busGeometry(), wood(hex));
    spec.highlight.color = outlineFor(hex); // it sits on a depot slot printed in its own colour
    m.castShadow = true;
    m.receiveShadow = true;
    spec.object = m;
    galleryFit(spec, 2.2, 1, 140);
    if (this.parentOutlet === "buses") {
      spec.splay.enabled = true;
      spec.splay.rows = 4;
      spec.splay.columns = 1;
      spec.splay.spacingMultiplier = 1.15;
    }
    spec.summary = `**Bus** (${PLAYER_COLORS[this.colorIndex].name})\n\nIn the depot, each bus carries one passenger per Vrrooomm!.`;
    spec.showDetailsOnLongPress = true;
  }
}
