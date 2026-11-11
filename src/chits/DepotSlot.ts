import { Chit, ChitRenderSpec, ChildOutlet } from "@pretty-chitty/core";
import { DEPOT } from "../geometry/board";
import { toWorld } from "../consts";
import { BusToken } from "./BusToken";

/** A printed slot in the bus depot (B9): column = colour, row = which bus. */
export class DepotSlot extends Chit {
  col = 0;
  row = 0;
  @ChildOutlet bus?: BusToken;

  render(spec: ChitRenderSpec): void {
    const d = DEPOT.find((s) => s.col === this.col && s.row === this.row)!;
    const p = toWorld(d.x, d.y);
    spec.offsetX = p.x;
    spec.offsetY = p.y;
    spec.childrenOffsetZ = 0;
    spec.worthSlidingToPanelToShowChange = false;
  }
}
