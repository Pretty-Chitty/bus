import { Chit, ChitRenderSpec, ChildOutlet } from "@pretty-chitty/core";
import { Mesh, BoxGeometry, TorusGeometry, Group } from "three";
import { LOCATIONS } from "../geometry/board";
import { NAVY, PX, SIZE, toWorld } from "../consts";
import { LocationFace } from "../canvas/LocationFace";
import { clickable, disc, phong } from "../render";
import { Building } from "./Building";

const LOC = new Map(LOCATIONS.map((l) => [l.id, l]));
/** A slate a few shades lighter than the printed navy. */
const LOCATION_SIDE = "#4b5070";

/** A building location (the encircled numbers, B2), joined by its printed leader line to one crossing.
 *  Holds at most one building (FB4). */
export class Location extends Chit {
  locationId = "";
  zone: 1 | 2 | 3 | 4 = 1;
  crossingId = "";

  @ChildOutlet building?: Building;

  render(spec: ChitRenderSpec): void {
    clickable(spec);
    const l = LOC.get(this.locationId)!;
    const p = toWorld(l.x, l.y);
    const r = l.r / PX + 0.03;
    const face = new LocationFace().set((f) => {
      f.zone = this.zone;
    });
    const g = new Group();
    // the navy top as printed; lighter sides, so the column reads as a cylinder (developer)
    g.add(disc(r, SIZE.locationThickness, face.material.clone(), phong(LOCATION_SIDE), 40));
    // the leader: a thin dark line from the disc's rim to its crossing, ending in a small ring
    const [x0, y0, x1, y1] = l.leader;
    const a = toWorld(x0, y0),
      b = toWorld(x1, y1);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len > 0.02) {
      const line = new Mesh(new BoxGeometry(len, 0.035, SIZE.leaderH), phong(NAVY));
      line.position.set((a.x + b.x) / 2 - p.x, (a.y + b.y) / 2 - p.y, -SIZE.locationThickness / 2 + SIZE.leaderH / 2);
      line.castShadow = true;
      line.rotation.z = Math.atan2(b.y - a.y, b.x - a.x);
      line.receiveShadow = true;
      g.add(line);
    }
    const ring = new Mesh(new TorusGeometry(0.05, 0.016, 8, 20), phong(NAVY));
    ring.position.set(b.x - p.x, b.y - p.y, -SIZE.locationThickness / 2 + SIZE.leaderH);
    g.add(ring);
    spec.object = g;
    spec.offsetX = p.x;
    spec.offsetY = p.y;
    spec.childrenOffsetZ = 0;
    spec.worthSlidingToPanelToShowChange = false;
    spec.summary = `**Building location, zone ${this.zone}**\n\nOne building may stand here. Zone ${this.zone} opens once every lower zone is full.`;
    spec.showDetailsOnLongPress = true;
  }
}
