import { Chit, ChitRenderSpec, Ordered, OrderedOutlet } from "@pretty-chitty/core";
import { Group } from "three";
import { NAVY } from "../consts";
import { Street } from "./Street";
import { Crossing } from "./Crossing";

/** Every street and crossing of the city map (B1–B4). They are solid white and share one outline (the
 *  engine's outline group: children inherit this chit's outline), so the network reads as the board prints
 *  it — one white web with a dark edge — and roads never z-fight where they meet. */
export class RoadNetwork extends Chit {
  @Ordered streets = new OrderedOutlet<Street>();
  @Ordered crossings = new OrderedOutlet<Crossing>();

  render(spec: ChitRenderSpec): void {
    spec.object = new Group();
    spec.highlight.color = NAVY;
    spec.highlight.childrenInheritOutline = true;
    spec.childrenOffsetZ = 0;
    spec.worthSlidingToPanelToShowChange = false;
  }
}
