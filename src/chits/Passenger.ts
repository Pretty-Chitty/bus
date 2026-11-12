import { Chit, ChitRenderSpec } from "@pretty-chitty/core";
import { ExtrudeGeometry, Group, Mesh, Shape } from "three";
import { PASSENGER_ASPECT, PASSENGER_COLOR, PASSENGER_OUTLINE } from "../geometry/shapes";
import { SIZE } from "../consts";
import { galleryFit, outlineFor, piece, wood } from "../render";

let geometry: ExtrudeGeometry | undefined;
function passengerGeometry() {
  if (!geometry) {
    const H = SIZE.passengerH;
    const w = PASSENGER_ASPECT * H;
    const shape = new Shape(PASSENGER_OUTLINE.map(([x, y]) => ({ x: x * H - w / 2, y: (1 - y) * H - H / 2 }) as any));
    geometry = new ExtrudeGeometry(shape, {
      depth: SIZE.passengerDepth,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
    geometry.translate(0, 0, -SIZE.passengerDepth / 2);
  }
  return geometry;
}

/** A passenger (C5): an orange wooden figure, traced from the board's own passenger icon. */
export class Passenger extends Chit {
  /** Look only: picked up for a Vrrooomm!, waiting to be told where to go. */
  raised = false;

  render(spec: ChitRenderSpec): void {
    piece(spec);
    if (this.raised) spec.offsetZ = 0.6;
    // a standing piece needs its own light, or its camera-facing side reads nearly black
    const mesh = new Mesh(passengerGeometry(), wood(PASSENGER_COLOR, 0.35));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.rotation.x = Math.PI / 2; // stand it up, face toward the viewer
    spec.object = new Group().add(mesh);
    spec.galleryRotateX = -Math.PI / 2;
    galleryFit(spec, 1, 1.2, 140);
    // an orange figure on the orange city reads poorly: outline in its own colour
    spec.highlight.color = outlineFor(PASSENGER_COLOR);
    spec.highlight.childrenInheritOutline = true; // its own outline, not the road network's
    // standing at a crossing: spread round it by own index (several can wait at one crossing)
    const at = this.parentOutlet === "passengers";
    if (at) {
      const i = this.parentOutletIndex ?? 0;
      const ring = i === 0 ? 0 : 1 + Math.floor((i - 1) / 6);
      const k = i === 0 ? 0 : (i - 1) % 6;
      const r = ring * 0.42;
      const t = (k / 6) * Math.PI * 2 + ring * 0.5;
      spec.offsetX = r * Math.cos(t);
      spec.offsetY = r * Math.sin(t);
    } else if (this.parentOutlet === "supply") {
      spec.splay.enabled = true;
      spec.splay.rows = 3;
      spec.splay.columns = 5;
      spec.splay.spacingMultiplier = 1.05;
    }
    spec.summary = "**Passenger**\n\nWants to be in the kind of building the clock shows.";
    spec.showDetailsOnLongPress = true;
  }
}
