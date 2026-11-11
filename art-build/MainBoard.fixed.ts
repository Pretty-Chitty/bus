import { Chit, ChitRenderSpec, ChildOutlet, Ordered, OrderedOutlet, PanelTab } from "@pretty-chitty/core";
import { Mesh, BoxGeometry } from "three";
import { ACTION_SPACES, CROSSINGS, DEPOT, LOCATIONS, STONE_SPACES, STREETS } from "../geometry/board";
import { BOARD_H, BOARD_W, CROSSING_BY_ID, LETTERS, SIZE, THEME, ActionId } from "../consts";
import { board } from "../assets/board";
import { station } from "../assets/icons";
import { imageMaterial, panelCamera, phong, setupTable } from "../render";
import { Street } from "./Street";
import { Crossing } from "./Crossing";
import { Location } from "./Location";
import { ActionSpace } from "./ActionSpace";
import { StoneSpace } from "./StoneSpace";
import { DepotSlot } from "./DepotSlot";
import { ClockHand } from "./ClockHand";
import { Staging } from "./Staging";
import { RoadNetwork } from "./RoadNetwork";

/** The game board (C1): the city map as chits over the board art, and the action area. */
export class MainBoard extends Chit {
  @ChildOutlet roads = new RoadNetwork();
  @Ordered locations = new OrderedOutlet<Location>();
  @Ordered actionSpaces = new OrderedOutlet<ActionSpace>();
  @Ordered stoneSpaces = new OrderedOutlet<StoneSpace>();
  @Ordered depotSlots = new OrderedOutlet<DepotSlot>();
  @ChildOutlet clockHand = new ClockHand();
  @ChildOutlet staging = new Staging();

  /** Build every printed spot from the measured geometry (setup, before the first flush). */
  build() {
    for (const s of STREETS) {
      // a = the western crossing, so the name reads a → b as printed
      const [a, b] = CROSSING_BY_ID.get(s.a)!.x <= CROSSING_BY_ID.get(s.b)!.x ? [s.a, s.b] : [s.b, s.a];
      this.roads.streets.add(new Street().set((t) => Object.assign(t, { streetId: s.id, name: s.name, a, b })));
    }
    for (const c of CROSSINGS) this.roads.crossings.add(new Crossing().set((t) => Object.assign(t, { crossingId: c.id, kind: c.kind })));
    for (const l of LOCATIONS)
      this.locations.add(new Location().set((t) => Object.assign(t, { locationId: l.id, zone: l.zone, crossingId: l.crossing })));
    for (const a of ACTION_SPACES)
      this.actionSpaces.add(new ActionSpace().set((t) => Object.assign(t, { action: a.action as ActionId, letter: a.letter })));
    STONE_SPACES.forEach((_, i) => this.stoneSpaces.add(new StoneSpace().set((t) => (t.index = i))));
    for (const d of DEPOT) this.depotSlots.add(new DepotSlot().set((t) => Object.assign(t, { col: d.col, row: d.row })));
  }

  // ---------------------------------------------------------------- lookups
  // A cache of chit objects must never outlive them: Back (and any reset) can rebuild the chits under this
  // board, and a cache still handing out the old objects sends every move to a chit no longer on the table.
  // So an entry is trusted only while it is still the live child it names; otherwise the map is rebuilt.
  private _street?: Map<string, Street>;
  private _crossing?: Map<string, Crossing>;
  private _location?: Map<string, Location>;
  street(id: string): Street {
    let s = this._street?.get(id);
    if (!s || s.parent !== this.roads || this.roads.parent !== this) {
      this._street = new Map(this.roads.streets.map((x) => [x.streetId, x]));
      s = this._street.get(id);
    }
    return s!;
  }
  crossing(id: string): Crossing {
    let c = this._crossing?.get(id);
    if (!c || c.parent !== this.roads || this.roads.parent !== this) {
      this._crossing = new Map(this.roads.crossings.map((x) => [x.crossingId, x]));
      c = this._crossing.get(id);
    }
    return c!;
  }
  location(id: string): Location {
    let l = this._location?.get(id);
    if (!l || l.parent !== this) {
      this._location = new Map(this.locations.map((x) => [x.locationId, x]));
      l = this._location.get(id);
    }
    return l!;
  }
  /** Spaces of one action in printed letter order A, B, … (single actions: one space). */
  spacesOf(action: ActionId): ActionSpace[] {
    return this.actionSpaces.filter((s) => s.action === action).sort((x, y) => LETTERS.indexOf(x.letter) - LETTERS.indexOf(y.letter));
  }
  depotColumn(col: number): DepotSlot[] {
    return this.depotSlots.filter((d) => d.col === col).sort((x, y) => x.row - y.row);
  }

  public get panelTab(): PanelTab {
    return { icon: station, color: THEME.ground };
  }

  render(spec: ChitRenderSpec): void {
    const side = phong("#e9e6dc");
    const top = imageMaterial(board);
    const m = new Mesh(new BoxGeometry(BOARD_W, BOARD_H, SIZE.boardThickness), [side, side, side, side, top, phong("#d8d4c8")]);
    m.castShadow = true;
    m.receiveShadow = true;
    spec.object = m;
    spec.childrenOffsetZ = 0;
    setupTable(spec, THEME.ground);
    panelCamera(spec, 4, 4, -0.32); // tilted enough to see the standing passengers, flat enough to fill the panel
    spec.camera!.maxZoom = 6; // on a phone the board is width-limited: pinch in to place pieces
    spec.worthSlidingToPanelToShowChange = false;
  }
}
