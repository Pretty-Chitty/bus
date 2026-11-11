// The rules as queries. Each function cites the RULES.md ids it implements. Pure: reads chits, writes nothing.
import { Root } from "./chits/Root";
import { Player } from "./chits/Player";
import { Street } from "./chits/Street";
import { Location } from "./chits/Location";
import { Crossing } from "./chits/Crossing";
import { Building } from "./chits/Building";
import { Passenger } from "./chits/Passenger";
import { ActionSpace } from "./chits/ActionSpace";
import {
  ACTIONS,
  ActionId,
  BuildingKind,
  BUS_TOKENS_PER_PLAYER,
  LOCATIONS_AT,
  STATION_IDS,
  STREETS_AT,
  otherEnd,
} from "./consts";

// ------------------------------------------------------------------ buses (MB, BU)
/** BU2: a player's buses are their tokens in the depot. */
export function busesOf(root: Root, p: Player): number {
  return root.mainBoard.depotColumn(p.colorIndex).filter((d) => d.bus).length;
}
/** MB2: the most buses owned by any one player. Read when each action resolves (MB4). */
export function maxBuses(root: Root): number {
  return Math.max(...root.players.map((p) => busesOf(root, p)));
}
/** BU4/Q6: a player can add a bus while a token is left. */
export function canBuyBus(root: Root, p: Player) {
  return busesOf(root, p) < BUS_TOKENS_PER_PLAYER && p.buses.length > 0;
}

/** MB3, LE1, PA1, BD1, P5.2: how many things the marker on `space` does. ≤ 0 means nothing (Q5). */
export function actionPower(root: Root, space: ActionSpace): number {
  const def = ACTIONS[space.action];
  if (!def.dwindles) return 1;
  const extra = space.action === "lineExpansion" && root.players.length === 5 ? 1 : 0; // P5.1–P5.3
  return maxBuses(root) - space.index + extra;
}

// ------------------------------------------------------------------ the bus line (LE)
export function colorOnStreet(s: Street, colorIndex: number) {
  return s.markers.some((m) => m.colorIndex === colorIndex);
}
/** The two ends of a player's line (LE4). Equal when the line is a closed circle (LE15). */
export function endsOf(p: Player): string[] {
  if (p.route.length === 0) return [];
  return [p.route[0], p.route[p.route.length - 1]];
}
/** The street a player's line ends along at crossing `end`, for each end at that crossing. */
function endStreets(p: Player, end: string): string[] {
  const r = p.route;
  const out: string[] = [];
  if (r.length < 2) return out;
  if (r[0] === end) out.push(streetIdBetween(r[0], r[1]));
  if (r[r.length - 1] === end) out.push(streetIdBetween(r[r.length - 1], r[r.length - 2]));
  return out;
}
function streetIdBetween(a: string, b: string): string {
  return STREETS_AT.get(a)!.find((s) => otherEnd(s, a) === b)!;
}

export interface Expansion {
  street: Street;
  /** the end the line grows from */
  from: string;
  /** the crossing the new street leads to */
  to: string;
  /** which LE rule made it legal, for the AI and the log */
  why: "first" | "empty" | "blocked" | "meeting";
}

/**
 * Every legal street for a player's next line marker.
 *  - FL1–FL2: the first marker may go on any street.
 *  - LE4: otherwise from one of the two ends.
 *  - LE12: never a street that already holds the player's colour.
 *  - LE5: onto an empty street, if that end has one.
 *  - LE7–LE8 (exception 1, per end: LE24): if that end has no empty street, alongside any other line.
 *  - LE9, LE10, LE13, LE14, LE22 (exception 2): where another player's line ends at the same crossing,
 *    alongside theirs for one street — the street their line ends along — provided every line already in
 *    that street ends at this crossing.
 */
export function legalExpansions(root: Root, p: Player): Expansion[] {
  const board = root.mainBoard;
  if (p.route.length === 0) {
    return board.roads.streets.map((s) => ({ street: s, from: s.a, to: s.b, why: "first" as const }));
  }
  const out: Expansion[] = [];
  const ends = [...new Set(endsOf(p))];
  for (const end of ends) {
    const here = STREETS_AT.get(end)!.map((id) => board.street(id)).filter((s) => !colorOnStreet(s, p.colorIndex));
    const empty = here.filter((s) => s.markers.length === 0);
    const add = (s: Street, why: Expansion["why"]) => {
      if (!out.some((e) => e.street === s && e.from === end)) out.push({ street: s, from: end, to: otherEnd(s.streetId, end), why });
    };
    if (empty.length) {
      empty.forEach((s) => add(s, "empty"));
      // exception 2: the other lines that end here
      for (const s of here) {
        if (s.markers.length === 0) continue;
        const colours = [...new Set(s.markers.map((m) => m.colorIndex))];
        const allEndHere = colours.every((c) => {
          const owner = root.players.find((q) => q.colorIndex === c);
          return !!owner && endStreets(owner, end).includes(s.streetId);
        });
        if (allEndHere) add(s, "meeting");
      }
    } else {
      here.forEach((s) => add(s, "blocked"));
    }
  }
  return out;
}

/** Apply an expansion to a player's route (LE3, LE15, LE17, LE23). The marker is moved by the caller. */
export function extendRoute(p: Player, e: Expansion) {
  const r = p.route.slice();
  if (r.length === 0) {
    p.route = [e.street.a, e.street.b];
    return;
  }
  if (r[r.length - 1] === e.from) r.push(e.to);
  else r.unshift(e.to);
  p.route = r;
}

/** LE16 [2024 rule 2]: the ends that touch another part of the line, each needing a marker to show it.
 *  A closed circle (both ends at one crossing) has both ends marked. */
export function ambiguousEnds(p: Player): string[] {
  const r = p.route;
  if (r.length < 3) return [];
  const count = (x: string) => r.filter((c) => c === x).length;
  const out: string[] = [];
  if (count(r[0]) > 1) out.push(r[0]);
  if (count(r[r.length - 1]) > 1) out.push(r[r.length - 1]);
  return out;
}

/** VR5: the crossings a player's buses can reach. */
export function lineCrossings(p: Player): Set<string> {
  return new Set(p.route);
}

// ------------------------------------------------------------------ buildings (FB, BD)
/** BD5/FB2: the lowest zone that still has a free location, or 0 when the city is full (BD6, EG4). */
export function openZone(root: Root): number {
  for (const z of [1, 2, 3, 4]) if (root.mainBoard.locations.some((l) => l.zone === z && !l.building)) return z;
  return 0;
}
/** BD3, BD5, FB4: where a building may be erected now. */
export function legalBuildingLocations(root: Root): Location[] {
  const z = openZone(root);
  return z ? root.mainBoard.locations.filter((l) => l.zone === z && !l.building) : [];
}

// ------------------------------------------------------------------ passengers (VR)
export function clockKind(root: Root): BuildingKind {
  return root.mainBoard.clockHand.position;
}
function buildingsAt(root: Root, crossing: string): Building[] {
  return LOCATIONS_AT.get(crossing)!
    .map((id) => root.mainBoard.location(id).building)
    .filter((b): b is Building => !!b);
}
/** VR9, VR11, Q14: passengers standing at a crossing want to get away (satisfied ones sit in buildings). */
export function waitingAt(c: Crossing): Passenger[] {
  return c.passengers.copy();
}
/** VR12–VR13: free buildings of the clock's kind at a crossing. */
export function freeBuildingsAt(root: Root, crossing: string): Building[] {
  const k = clockKind(root);
  return buildingsAt(root, crossing).filter((b) => b.kind === k && !b.passenger);
}

export interface VroomOptions {
  passengers: Passenger[];
  buildings: Building[];
  /** VR16, Q17: the number that must be carried. */
  max: number;
}
/** VR2–VR5, VR11–VR16: what one Vrrooomm! can carry for a player, with `used` buses already run. */
export function vroomOptions(root: Root, p: Player, busesLeft: number): VroomOptions {
  const line = lineCrossings(p);
  const passengers: Passenger[] = [];
  const buildings: Building[] = [];
  for (const id of line) {
    passengers.push(...waitingAt(root.mainBoard.crossing(id)));
    buildings.push(...freeBuildingsAt(root, id));
  }
  return { passengers, buildings, max: Math.min(busesLeft, passengers.length, buildings.length) };
}

// ------------------------------------------------------------------ actions (CA)
/** CA6, CA10: the space a player would take in each action now (the lowest free letter); none if full. */
export function nextFreeSpaces(root: Root): ActionSpace[] {
  const out: ActionSpace[] = [];
  for (const id of Object.keys(ACTIONS) as ActionId[]) {
    const free = root.mainBoard.spacesOf(id).find((s) => !s.marker);
    if (free) out.push(free);
  }
  return out;
}
/** RA2–RA4: the occupied spaces of an action in resolution order. */
export function resolutionOrder(root: Root, action: ActionId): ActionSpace[] {
  const spaces = root.mainBoard.spacesOf(action).filter((s) => s.marker);
  return ACTIONS[action].order === "lastChosen" ? spaces.reverse() : spaces;
}

// ------------------------------------------------------------------ scoring and estimates
/** EG5–EG7: points minus time stones; ties to the most stones, then to whoever reached the score first. */
export function finalStandings(root: Root) {
  const rows = root.players.map((p) => ({ p, net: p.score - p.stones.length, stones: p.stones.length, stamp: p.scoreStamp }));
  rows.sort((a, b) => b.net - a.net || b.stones - a.stones || a.stamp - b.stamp);
  const top = rows[0];
  const winners = rows.filter((r) => r.net === top.net && r.stones === top.stones && r.stamp === top.stamp).map((r) => r.p);
  return { rows, winners };
}


/** What-ifs for estimates: an extra building or passenger at a crossing. */
export interface Extra {
  crossing: string;
  building?: BuildingKind;
  passenger?: boolean;
}
/** How many passengers buses on `crossings` could carry if the clock showed `k`, after the Clock step re-seats
 *  everyone (CL9): min(buses, waiting, free) over those crossings. For the player aid and the AI. */
export function deliverableAt(root: Root, crossings: Iterable<string>, k: BuildingKind, buses = Infinity, extras: Extra[] = []): number {
  let waiting = 0,
    free = 0;
  for (const id of new Set(crossings)) {
    const c = root.mainBoard.crossing(id);
    const bs = LOCATIONS_AT.get(id)!.map((l) => root.mainBoard.location(l).building).filter((b): b is Building => !!b);
    let people = c.passengers.length + bs.filter((b) => b.passenger).length;
    let slots = bs.filter((b) => b.kind === k).length;
    for (const e of extras) {
      if (e.crossing !== id) continue;
      if (e.passenger) people++;
      if (e.building === k) slots++;
    }
    waiting += Math.max(0, people - slots);
    free += Math.max(0, slots - people);
  }
  return Math.min(buses, waiting, free);
}
/** A player's own line, with their buses. */
export function deliverable(root: Root, p: Player, k: BuildingKind, buses = busesOf(root, p)): number {
  return deliverableAt(root, p.route, k, buses);
}

export { STATION_IDS };
