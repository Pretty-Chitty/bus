import { RootChit, DropdownChit, ChildOutlet, LayoutNode } from "@pretty-chitty/core";
import { PlayerAid } from "./PlayerAid";
import { Player } from "./Player";
import { MainBoard } from "./MainBoard";
import { MAX_PLAYERS, MIN_PLAYERS } from "../consts";

export class Root extends RootChit<Player> {
  minPlayers = MIN_PLAYERS;
  maxPlayers = MAX_PLAYERS;

  @ChildOutlet public mainBoard = new MainBoard();
  @ChildOutlet public playerAid = new PlayerAid();

  round = 0;
  /** Bumped whenever anyone scores, to order disks that share a score (EG7). */
  scoreClock = 0;
  /** Why the game ended, once it has: "stones" (EG2), "markers" (EG3), "locations" (EG4). */
  endReason = "";

  override setupDemoGame() {
    return 4;
  }

  override getDropdowns(): DropdownChit[] {
    return [this.playerAid];
  }

  override getLayout(width: number, height: number, playerId: string): LayoutNode {
    const me = this.players.find((p) => p.playerId === playerId);
    const others = this.players.filter((p) => p !== me);
    // Space is shared in proportion to these minimums: the board takes ~3/4 of a desktop, and on a phone
    // the board stacks above the viewer's tray and the opponents' tab group.
    const tray = (p: Player, order: number) => ({ order, chit: p, minWidth: 110, minHeight: 70 });
    // A phone held upright: the board on top (it is wide, so width-limited: it needs no more than about two
    // thirds of the height), and every tray in one tab group below it, yours first, big enough to read. Also a
    // phone whose game area is near square (the playground's header, a browser bar): side by side, the viewer's tray
    // was ~40 px tall (the developer: "comically small"); here, short of room, it collapses to one panel in tabs.
    if (width < 700 && height > width * 0.7) {
      const all = me ? [me, ...others] : others;
      return {
        direction: "vertical",
        collapseOrder: 5,
        splits: [
          { order: 1, chit: this.mainBoard, minWidth: 300, minHeight: 300 },
          { panels: all.map((p, i) => tray(p, i === 0 && me ? 100 : 10 + i)), minWidth: 200, minHeight: 150 }, // too short for both: one panel at a time, in tabs (the developer)
        ],
      };
    }
    const side: LayoutNode[] = [];
    if (me) side.push(tray(me, 100));
    if (others.length) side.push({ panels: others.map((p, i) => tray(p, 10 + i)), minWidth: 110, minHeight: 70 });
    return {
      direction: "optimizePreferHorizontal",
      collapseOrder: 5,
      splits: [
        { order: 1, chit: this.mainBoard, minWidth: 380, minHeight: 270 },
        { direction: "optimizePreferVertical", collapseOrder: 4, splits: side },
      ],
    };
  }
}
