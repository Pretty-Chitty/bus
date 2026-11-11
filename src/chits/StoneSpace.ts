import { Chit, ChitRenderSpec, ChildOutlet } from "@pretty-chitty/core";
import { STONE_SPACES } from "../geometry/board";
import { toWorld } from "../consts";
import { TimeStone } from "./TimeStone";

/** One of the five printed time-stone spaces on the clock's time-control device (B7). */
export class StoneSpace extends Chit {
  index = 0;
  @ChildOutlet stone?: TimeStone;

  render(spec: ChitRenderSpec): void {
    const s = STONE_SPACES[this.index];
    const p = toWorld(s.x, s.y);
    spec.offsetX = p.x;
    spec.offsetY = p.y;
    spec.childrenOffsetZ = 0;
    spec.worthSlidingToPanelToShowChange = false;
  }
}
