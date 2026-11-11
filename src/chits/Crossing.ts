import { Chit, ChitRenderSpec, Ordered, OrderedOutlet } from "@pretty-chitty/core";
import { CROSSING_BY_ID, PAPER, SIZE, toWorld } from "../consts";
import { CrossingFace } from "../canvas/CrossingFace";
import { clickable, disc, phong } from "../render";
import { Passenger } from "./Passenger";
import { ActionMarker } from "./ActionMarker";

export type CrossingKind = "plain" | "roundabout" | "station";

/** A crossing of the city map (B1, B3, B4). Passengers stand here while they wait for a bus (VR6, VR9). */
export class Crossing extends Chit {
  crossingId = "";
  kind: CrossingKind = "plain";

  @Ordered passengers = new OrderedOutlet<Passenger>();
  /** LE16: spent action markers showing where a looped line's ends are. */
  @Ordered ends = new OrderedOutlet<ActionMarker>();

  get radius() {
    return this.kind === "station" ? SIZE.stationR : this.kind === "roundabout" ? SIZE.roundaboutR : SIZE.plainCrossingR;
  }

  render(spec: ChitRenderSpec): void {
    clickable(spec);
    const c = CROSSING_BY_ID.get(this.crossingId)!;
    const p = toWorld(c.x, c.y);
    const face = new CrossingFace().set((f) => {
      f.kind = this.kind;
    });
    spec.object = disc(this.radius, SIZE.crossingThickness, face.material.clone(), phong(PAPER), 56);
    spec.offsetX = p.x;
    spec.offsetY = p.y;
    spec.childrenOffsetZ = 0;
    spec.worthSlidingToPanelToShowChange = false;
    spec.summary =
      this.kind === "station"
        ? "**Train station**\n\nNew passengers arrive here (Passengers action). A station has no buildings, so everyone here wants to get away."
        : this.kind === "roundabout"
          ? "**Roundabout**\n\nA crossing beside Central Park. Each starts the game with one passenger."
          : "**Crossing**\n\nPassengers wait here for a bus. The buildings joined to it by a line are at this crossing.";
    spec.showDetailsOnLongPress = true;
  }
}
