import { Chit, ChitRenderSpec } from "@pretty-chitty/core";
import { BoxGeometry, ExtrudeGeometry, Group, Mesh, Shape } from "three";
import { CLOCK } from "../geometry/board";
import { BuildingKind, SIZE, toWorld } from "../consts";
import { hitMaterial, phong } from "../render";

const DEPTH = 0.05;
/** How far below the hand its counterweight hangs: under the table, so neither it nor its outline shows. */
const SINK = 3;
let handGeometry: ExtrudeGeometry | undefined;
function hand() {
  if (!handGeometry) {
    const L = SIZE.handLength,
      w = SIZE.handWidth;
    const s = new Shape();
    // a pointer: round hub on the pivot (the origin), tapering to a point along +x
    s.absarc(0, 0, w * 0.75, Math.PI * 0.5, Math.PI * 1.5, false);
    s.lineTo(L * 0.82, -w * 0.32);
    s.lineTo(L, 0);
    s.lineTo(L * 0.82, w * 0.32);
    s.lineTo(0, w * 0.75);
    handGeometry = new ExtrudeGeometry(s, { depth: DEPTH, bevelEnabled: false });
  }
  return handGeometry;
}

/** The cardboard clock hand (S5, CL4–CL5), pinned at the clock's pivot, pointing at a building type. */
export class ClockHand extends Chit {
  position: BuildingKind = "house";

  render(spec: ChitRenderSpec): void {
    const p = toWorld(CLOCK.cx, CLOCK.cy);
    const m = new Mesh(hand(), [phong("#232533"), phong("#3a3d4f")]);
    m.castShadow = true;
    m.receiveShadow = true;
    // The engine places a chit by its bounds' centre and turns it about that point. An invisible
    // counterweight, the hand's mirror image in length, puts that centre on the pivot: the hand then
    // turns about its hub, as the real one does on its fastener. It hangs SINK below, under the table.
    const weight = new Mesh(new BoxGeometry(SIZE.handLength * 2, 0.01, 0.01), hitMaterial());
    weight.position.z = -SINK;
    spec.object = new Group().add(m, weight);
    spec.rotateZ = (-CLOCK[this.position] * Math.PI) / 180; // image angles run clockwise with y down
    spec.offsetX = p.x;
    spec.offsetY = p.y;
    // the bounds now start at the counterweight: lower the chit so the hand itself lies on the dial
    spec.offsetZ = 0.01 - (SINK + 0.005);
    spec.rotationSpeed = 900;
    // dark cardboard on the dark dial: a light outline makes it readable
    spec.highlight.color = "#efe9d8";
    spec.summary = `**The clock**\n\nIt shows the ${this.position}: passengers want to be in a ${this.position} now. Each round it moves on (house → office → pub) unless someone stops time.`;
    spec.showDetailsOnLongPress = true;
  }
}
