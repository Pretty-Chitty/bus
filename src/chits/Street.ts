import { Chit, ChitRenderSpec, Ordered, OrderedOutlet } from "@pretty-chitty/core";
import { BoxGeometry, Mesh } from "three";
import { CROSSING_BY_ID, PAPER, SIZE, STREET_LAYER, toWorld } from "../consts";
import { StreetFace, ROAD_TEXELS } from "../canvas/StreetFace";
import { clickable, phong } from "../render";
import { LineMarker } from "./LineMarker";

const RADIUS = { plain: SIZE.plainCrossingR, roundabout: SIZE.roundaboutR, station: SIZE.stationR };

/** A street of the city map (B1): a road between two crossings, with its printed name. Line markers lie
 *  on it, side by side when several lines share it (LE7–LE10). `a` is always the western crossing, so the
 *  name reads from a to b as it does on the board. */
export class Street extends Chit {
  streetId = "";
  name = "";
  a = "";
  b = "";

  @Ordered markers = new OrderedOutlet<LineMarker>();

  /** World geometry, from the street's own fixed fields. */
  geometry() {
    const A = CROSSING_BY_ID.get(this.a)!,
      B = CROSSING_BY_ID.get(this.b)!;
    const pa = toWorld(A.x, A.y),
      pb = toWorld(B.x, B.y);
    const len = Math.hypot(pb.x - pa.x, pb.y - pa.y);
    return {
      cx: (pa.x + pb.x) / 2,
      cy: (pa.y + pb.y) / 2,
      len,
      angle: Math.atan2(pb.y - pa.y, pb.x - pa.x),
      rA: RADIUS[A.kind],
      rB: RADIUS[B.kind],
    };
  }

  render(spec: ChitRenderSpec): void {
    clickable(spec);
    const g = this.geometry();
    const len = Math.round(g.len * 20) / 20;
    const face = new StreetFace().set((f) => {
      f.width = Math.round(len * ROAD_TEXELS);
      f.height = Math.round(SIZE.roadWidth * ROAD_TEXELS);
      f.name = this.name;
      f.padL = Math.round(g.rA * 20) / 20;
      f.padR = Math.round(g.rB * 20) / 20;
    });
    // Solid white, outlined with the rest of the network; each street a step higher than its
    // neighbours' (its layer), so where ends overlap one is cleanly above the other.
    const h = SIZE.roadH + 0.006 * (STREET_LAYER.get(this.streetId) ?? 0);
    const side = phong(PAPER);
    const mesh = new Mesh(new BoxGeometry(len, SIZE.roadWidth, h), [side, side, side, side, face.material.clone(), side]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    spec.object = mesh;
    spec.offsetX = g.cx;
    spec.offsetY = g.cy;
    spec.rotateZ = g.angle;
    spec.childrenOffsetZ = 0;
    spec.worthSlidingToPanelToShowChange = false;
    spec.summary = `**${this.name}**\n\nA street. Bus lines are laid along streets, one line marker per street.`;
    spec.showDetailsOnLongPress = true;
  }
}
