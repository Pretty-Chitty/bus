import { Chit, ChitRenderSpec, ChildOutlet } from "@pretty-chitty/core";
import { Group } from "three";
import { ACTION_SPACES } from "../geometry/board";
import { ACTIONS, ActionId, LETTERS, PX, toWorld } from "../consts";
import { buildings, buses, clock, lineExpansion, passengers, standee, vroom } from "../assets/icons";
import { clickable, galleryFit, galleryPicture, hitDisc } from "../render";
import { ActionMarker } from "./ActionMarker";
import { Cursor } from "./Cursor";

export const ACTION_PICTURE = { lineExpansion, buses, passengers, buildings, clock, vroom, startingPlayer: standee };

/** A printed action space (B8): the board prints it, so on the table this is only a click target; its
 *  picture lies face-down for the gallery and long-press. An action marker stands on it once chosen. */
export class ActionSpace extends Chit {
  action: ActionId = "vroom";
  /** "A".."F", or "A" for the single spaces. */
  letter = "A";

  @ChildOutlet marker?: ActionMarker;
  /** The resolving pointer, while this space is being carried out. */
  @ChildOutlet cursor?: Cursor;

  get index() {
    return LETTERS.indexOf(this.letter);
  }

  render(spec: ChitRenderSpec): void {
    clickable(spec);
    const s = ACTION_SPACES.find((a) => a.action === this.action && a.letter === this.letter)!;
    const p = toWorld(s.x, s.y);
    const r = s.r / PX;
    const def = ACTIONS[this.action];
    const g = new Group();
    g.add(hitDisc(r + 0.04, 0.02));
    const pic = ACTION_PICTURE[this.action];
    const aspect = pic.primary.bounds.width / pic.primary.bounds.height;
    g.add(galleryPicture(pic, aspect >= 1 ? 1.2 : 1.2 * aspect, aspect >= 1 ? 1.2 / aspect : 1.2));
    spec.object = g;
    spec.galleryRotateY = Math.PI;
    spec.offsetX = p.x;
    spec.offsetY = p.y;
    spec.offsetZ = 0.005;
    spec.childrenOffsetZ = 0;
    spec.worthSlidingToPanelToShowChange = false;
    galleryFit(spec, 1, 1, 130);
    const where = def.multi ? ` — space ${this.letter}` : "";
    spec.shortSummary = def.multi ? `${def.name} ${this.letter}` : def.name;
    spec.summary = `**${def.name}**${where}\n\n${def.rules}`;
    spec.showDetailsOnLongPress = true;
  }
}
