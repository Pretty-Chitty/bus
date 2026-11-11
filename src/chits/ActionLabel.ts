import { Chit, ChitRenderSpec } from "@pretty-chitty/core";
import { ActionId, PX, toWorld } from "../consts";
import { hitBox } from "../render";

/** Where each action's name is printed on the board (scan px: centre and size), measured by eye on
 *  art-src/tts/board.png with a 100 px grid (art-build/shots/action-grid.png). The Clock prints no name: its dial
 *  stands for it. */
export const ACTION_LABELS: Partial<Record<ActionId, { x: number; y: number; w: number; h: number }>> = {
  lineExpansion: { x: 3228, y: 356, w: 216, h: 32 },
  buses: { x: 3164, y: 625, w: 90, h: 32 },
  passengers: { x: 3206, y: 1141, w: 172, h: 32 },
  buildings: { x: 3188, y: 1409, w: 136, h: 32 },
  vroom: { x: 3210, y: 2342, w: 172, h: 32 },
  startingPlayer: { x: 3232, y: 2610, w: 216, h: 32 },
};

/** Not a component: an invisible box over an action's printed name, so a highlight can take the name in with
 *  the space (the developer: zoomed onto a space, "we're not seeing the label for the space at all"). */
export class ActionLabel extends Chit {
  action: ActionId = "buses";

  render(spec: ChitRenderSpec): void {
    const l = ACTION_LABELS[this.action]!;
    const p = toWorld(l.x, l.y);
    spec.object = hitBox(l.w / PX, l.h / PX, 0.01);
    spec.offsetX = p.x;
    spec.offsetY = p.y;
    spec.offsetZ = 0.005;
    spec.worthSlidingToPanelToShowChange = false;
  }
}
