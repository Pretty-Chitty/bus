import { Chit, ChitRenderSpec } from "@pretty-chitty/core";
import { ExtrudeGeometry, Mesh, Shape } from "three";
import { NAVY } from "../consts";
import { wood } from "../render";

/** Bright enough to find at a glance on the white action column, and not the click colour. */
const CURSOR_HEX = "#ffc928";

let geo: ExtrudeGeometry | undefined;
/** An arrow pointing down (−y), its tip at the origin. */
function arrowGeometry() {
  if (!geo) {
    const s = new Shape();
    s.moveTo(0, 0);
    s.lineTo(0.3, 0.32);
    s.lineTo(0.11, 0.32);
    s.lineTo(0.11, 0.72);
    s.lineTo(-0.11, 0.72);
    s.lineTo(-0.11, 0.32);
    s.lineTo(-0.3, 0.32);
    s.closePath();
    geo = new ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
  }
  return geo;
}

/** Not a component: a pointer that follows the game while the actions resolve, standing over the action space
 *  being carried out (the developer: "it's hard to track the game as it progresses"). Out of sight while
 *  everyone chooses. */
export class Cursor extends Chit {
  /** Where the tip points, from the parent's centre (set when it moves; a render reads only its own chit). */
  tipY = 0;

  render(spec: ChitRenderSpec): void {
    const m = new Mesh(arrowGeometry(), wood(CURSOR_HEX, 0.35));
    m.castShadow = true;
    spec.object = m;
    spec.offsetY = this.tipY;
    spec.offsetZ = 0.35; // floats above a marker standing on the space
    spec.highlight.color = NAVY;
    spec.worthSlidingToPanelToShowChange = false;
    spec.summary = "**Now resolving**\n\nThe action this arrow points at is being carried out.";
  }
}
