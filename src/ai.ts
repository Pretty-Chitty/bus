// Heuristic AI rules, one per `.ai(key)` tag. Each choice is valued by how it changes what a line could carry
// (rules.ts `deliverableAt`), over the clock's next setting and the ones after. The board is public.
import { defineAi } from "@pretty-chitty/core";
import { Root } from "./chits/Root";
import { Player } from "./chits/Player";
import { ActionSpace } from "./chits/ActionSpace";
import { Street } from "./chits/Street";
import { Crossing } from "./chits/Crossing";
import { BuildingOption } from "./chits/BuildingMenu";
import { Location } from "./chits/Location";
import { BUILDING_KINDS, BuildingKind, LOCATIONS_AT, STATION_IDS, STREETS_AT, nextClock } from "./consts";
import {
  Extra,
  actionPower,
  busesOf,
  canBuyBus,
  clockKind,
  deliverable,
  deliverableAt,
  legalBuildingLocations,
  legalExpansions,
  maxBuses,
  openZone,
} from "./rules";

type Memory = Record<string, never>;

/** Every constant the rules use, tunable by self-play (scripts/tune). v1 = these defaults, frozen. */
export const DEFAULT_WEIGHTS = {
  reachGain: 2.2,
  reachOpen: 0.35,
  reachKinds: 0.35,
  reachPeople: 0.4,
  reachStreets: 0.3,
  reachStation: 1.6,
  reachServed: 0.8,
  lineEmpty: 0.2,
  bldMine: 3,
  bldTheirs: 1.6,
  bldVariety: 0.4,
  bldNear: 0.5,
  h1: 1,
  h2: 0.55,
  h3: 0.45,
  vroomBase: 1.4,
  vroomPer: 2.6,
  vroomLetter: 0.1,
  vroomNone: -3,
  vroomCompete: 1,
  lineBase: 0.6,
  linePower: 0.35,
  lineBest: 0.55,
  lineAgain: 0.6,
  busBase: 1.4,
  busNeed: 1.4,
  busNoNeed: 0.2,
  busBehind: 0.6,
  busEarly: 0.8,
  paxBase: 0.4,
  paxReach: 0.5,
  paxNoReach: 0.1,
  bldgBase: 0.5,
  bldgPower: 0.25,
  bldgBest: 0.5,
  bldgAgain: 0.6,
  clock2: 2.6,
  clock1: 1.3,
  clock0: 0.2,
  clockEndLead: 6,
  clockEndBehind: -4,
  startVal: 0.8,
  startHeld: 0.1,
  pass: 1.7,
  passLow: 0.7,
  passLowAt: 6,
  paxMine: 2,
  paxTheirs: 1.2,
  paxOnLine: 0.5,
  stopCost: 1.1,
};
export type Weights = typeof DEFAULT_WEIGHTS;
/** Tuning ranges: each weight between 0 and three times its default (negatives mirrored). */
export const WEIGHT_RANGES: Record<keyof Weights, [number, number]> = Object.fromEntries(
  Object.entries(DEFAULT_WEIGHTS).map(([k, v]) => [k, v >= 0 ? [0, Math.max(1, v * 3)] : [v * 3, 0]]),
) as any;
/** The tuned weights the shipped bot plays (scripts/tune writes best.json; copy it here). */
export const SHIPPED_WEIGHTS: Partial<Weights> = {};

// The weights of the seat being scored: set by each rule call (rules run one at a time per bot).
let current: Weights = { ...DEFAULT_WEIGHTS, ...SHIPPED_WEIGHTS };
function W(): Weights {
  return current;
}
function seatWeights(params: any): Weights {
  if (params?.version === "v1") return DEFAULT_WEIGHTS;
  return { ...DEFAULT_WEIGHTS, ...SHIPPED_WEIGHTS, ...(params?.weights ?? {}) };
}

/** Clock settings ahead and how much each matters: the next Vrrooomm! sees `next`. */
function horizon(root: Root): [BuildingKind, number][] {
  const now = clockKind(root);
  const n1 = nextClock(now),
    n2 = nextClock(n1);
  return [
    [n1, W().h1],
    [n2, W().h2],
    [now, W().h3],
  ];
}
/** Weighted potential of a set of crossings (unlimited buses), with what-ifs. */
function potential(root: Root, crossings: Iterable<string>, extras: Extra[] = []) {
  return horizon(root).reduce((sum, [k, w]) => sum + w * deliverableAt(root, crossings, k, Infinity, extras), 0);
}
function emptyStreets(root: Root, crossing: string) {
  return STREETS_AT.get(crossing)!.filter((s) => root.mainBoard.street(s).markers.length === 0).length;
}
function rivals(root: Root, me: Player) {
  return root.players.filter((p) => p !== me);
}

/** What reaching crossing `x` adds to my line, now and as the city grows. */
function reachValue(root: Root, me: Player, x: string) {
  const before = potential(root, me.route);
  const after = potential(root, [...me.route, x]);
  const locs = LOCATIONS_AT.get(x)!.map((l) => root.mainBoard.location(l));
  const open = locs.filter((l) => !l.building).length;
  const kinds = new Set(locs.map((l) => l.building?.kind).filter(Boolean)).size;
  const people = root.mainBoard.crossing(x).passengers.length;
  const w = W();
  let v = w.reachGain * (after - before) + w.reachOpen * open + w.reachKinds * kinds + w.reachPeople * people + w.reachStreets * Math.min(3, emptyStreets(root, x));
  if (STATION_IDS.includes(x)) v += w.reachStation;
  if (me.route.includes(x)) v -= w.reachServed; // already served
  return v;
}

function lineScore(root: Root, me: Player, street: Street): number {
  const ex = legalExpansions(root, me).filter((e) => e.street === street);
  if (!ex.length) return -10;
  if (ex[0].why === "first") return reachValue(root, me, street.a) + reachValue(root, me, street.b);
  return Math.max(...ex.map((e) => reachValue(root, me, e.to) + (e.why === "empty" ? W().lineEmpty : 0)));
}

/** A building's worth to me, minus its worth to the rivals whose lines it also serves. */
function buildingScore(root: Root, me: Player, kind: BuildingKind, loc: Location): number {
  const extra = [{ crossing: loc.crossingId, building: kind }];
  const mine = me.route.length ? potential(root, me.route, extra) - potential(root, me.route) : 0;
  let theirs = 0;
  for (const r of rivals(root, me)) if (r.route.includes(loc.crossingId)) theirs += potential(root, r.route, extra) - potential(root, r.route);
  // before any line exists: spread the kinds, so every crossing has something to offer
  const here = LOCATIONS_AT.get(loc.crossingId)!.map((l) => root.mainBoard.location(l).building?.kind).filter(Boolean);
  const w = W();
  const variety = here.includes(kind) ? 0 : w.bldVariety;
  const near = me.route.length === 0 ? 0 : me.route.includes(loc.crossingId) ? w.bldNear : 0;
  return w.bldMine * mine - w.bldTheirs * theirs + variety + near;
}

/** A kind's worth: its best free location. */
function bestFor(root: Root, me: Player, kind: BuildingKind) {
  return Math.max(-10, ...legalBuildingLocations(root).map((loc) => buildingScore(root, me, kind, loc)));
}

function bestBuilding(root: Root, me: Player) {
  let best = 0;
  for (const loc of legalBuildingLocations(root))
    for (const k of BUILDING_KINDS) best = Math.max(best, buildingScore(root, me, k, loc));
  return best;
}
function bestLine(root: Root, me: Player) {
  const ex = legalExpansions(root, me);
  return ex.length ? Math.max(...ex.map((e) => (e.why === "first" ? 0 : reachValue(root, me, e.to)))) : -1;
}

function vroomCarry(root: Root, me: Player, already: number) {
  const now = clockKind(root);
  const holdsClock = root.mainBoard.spacesOf("clock").some((s) => s.marker?.colorIndex === me.colorIndex);
  const k = holdsClock && deliverableAt(root, me.route, now) > deliverableAt(root, me.route, nextClock(now)) ? now : nextClock(now);
  let pot = deliverableAt(root, me.route, k);
  // Rivals on earlier Vrrooomm! spaces carry first (RA4): what they can take where our lines share crossings
  // is gone before our buses run.
  const mine = new Set(me.route);
  for (const s of root.mainBoard.spacesOf("vroom")) {
    if (!s.marker || s.marker.colorIndex === me.colorIndex) continue;
    const rival = root.players.find((p) => p.colorIndex === s.marker!.colorIndex);
    if (!rival) continue;
    const shared = rival.route.filter((c) => mine.has(c));
    if (shared.length) pot -= W().vroomCompete * Math.min(busesOf(root, rival), deliverableAt(root, shared, k));
  }
  const buses = busesOf(root, me);
  return Math.min(buses, Math.max(0, Math.round(pot) - buses * already));
}

function leadOverBest(root: Root, me: Player) {
  const best = Math.max(...rivals(root, me).map((p) => p.score - p.stones.length));
  return me.score - me.stones.length - best;
}

function actionValue(root: Root, me: Player, s: ActionSpace): number {
  const power = actionPower(root, s);
  const w = W();
  const mineOn = (a: string) => root.mainBoard.spacesOf(a as any).filter((x) => x.marker?.colorIndex === me.colorIndex).length;
  switch (s.action) {
    case "vroom": {
      const carry = vroomCarry(root, me, mineOn("vroom"));
      if (carry === 0) return w.vroomNone;
      return w.vroomBase + w.vroomPer * carry * (1 - w.vroomLetter * s.index); // earlier spaces carry first (RA4)
    }
    case "lineExpansion": {
      if (power <= 0) return -6;
      return w.lineBase + w.linePower * Math.min(power, 4) + w.lineBest * Math.max(0, bestLine(root, me)) - w.lineAgain * mineOn("lineExpansion");
    }
    case "buses": {
      if (!canBuyBus(root, me)) return -8;
      const mine = busesOf(root, me);
      const pot = Math.max(...horizon(root).map(([k]) => deliverableAt(root, me.route, k)));
      return w.busBase + (pot > mine ? w.busNeed : w.busNoNeed) + (mine < maxBuses(root) ? w.busBehind : 0) + (root.round <= 3 ? w.busEarly : 0);
    }
    case "passengers": {
      if (power <= 0 || root.mainBoard.supply === 0) return -6;
      const reach = STATION_IDS.some((id) => me.route.includes(id));
      return w.paxBase + (reach ? w.paxReach * Math.min(power, 3) : w.paxNoReach);
    }
    case "buildings": {
      if (power <= 0 || openZone(root) === 0) return -6;
      return w.bldgBase + w.bldgPower * Math.min(power, 3) + w.bldgBest * bestBuilding(root, me) - w.bldgAgain * mineOn("buildings");
    }
    case "clock": {
      const now = clockKind(root);
      const gain = deliverable(root, me, now) - deliverable(root, me, nextClock(now));
      const stonesLeft = root.mainBoard.stoneSpaces.filter((x) => !!x.stone).length;
      if (stonesLeft === 1) return leadOverBest(root, me) > 0 ? w.clockEndLead : w.clockEndBehind;
      return gain >= 2 ? w.clock2 : gain === 1 ? w.clock1 : w.clock0;
    }
    case "startingPlayer":
      return me.startBus ? w.startHeld : w.startVal;
  }
}

const RULES: Record<string, (o: any, ctx: any) => number> = {
    "choose.action": (o, { view, me, random }) => actionValue(view, me, (o as any).chit as ActionSpace) + random() * 0.25,
    // markers are the game's clock: keep some for later rounds
    "choose.pass": (_o, { me }) => W().pass + (me.markers.length < W().passLowAt ? W().passLow : 0),

    "setup.line": (o, { view, me, random }) => lineScore(view, me, (o as any).chit as Street) + random() * 0.4,
    "setup.line2": (o, { view, me, random }) => lineScore(view, me, (o as any).chit as Street) + random() * 0.2,
    "line.place": (o, { view, me, random }) => lineScore(view, me, (o as any).chit as Street) + random() * 0.2,
    "line.end": (o, { view }) => emptyStreets(view, ((o as any).chit as Crossing).crossingId),

    // a building is two picks: the kind (worth its best location), then the location for the kind chosen
    "setup.building.kind": (o, { view, me, random }) => bestFor(view, me, ((o as any).chit as BuildingOption).kind) + random() * 0.6,
    "building.place.kind": (o, { view, me, random }) => bestFor(view, me, ((o as any).chit as BuildingOption).kind) + random() * 0.2,
    "setup.building": (o, { view, me, random }) => buildingScore(view, me, (view.mainBoard.placing || "house"), (o as any).chit as Location) + random() * 0.3,
    "building.place": (o, { view, me, random }) => buildingScore(view, me, (view.mainBoard.placing || "house"), (o as any).chit as Location) + random() * 0.1,

    "passenger.place": (o, { view, me, random }) => {
      const st = ((o as any).chit as Crossing).crossingId;
      const extra = [{ crossing: st, passenger: true }];
      const mine = potential(view, me.route, extra) - potential(view, me.route);
      const theirs = rivals(view, me).reduce((s, r) => s + (r.route.includes(st) ? potential(view, r.route, extra) - potential(view, r.route) : 0), 0);
      return W().paxMine * mine - W().paxTheirs * theirs + (me.route.includes(st) ? W().paxOnLine : 0) + random() * 0.2;
    },

    "clock.stop": (_o, { view, me }: { view: Root; me: Player }) => {
      const now = clockKind(view);
      const stonesLeft = view.mainBoard.stoneSpaces.filter((x) => !!x.stone).length;
      if (stonesLeft === 1) return leadOverBest(view, me) > 0 ? 10 : -10;
      return deliverable(view, me, now) - deliverable(view, me, nextClock(now)) - W().stopCost;
    },
    "clock.run": () => 0,

    // VR: any waiting passenger to any free building scores the same point
    "vroom.passenger": (_o, { random }) => 1 + random(),
    "vroom.building": (_o, { random }) => 1 + random(),
    "vroom.switch": () => -1, // picking up a different passenger instead: never needed
};

export const ai = defineAi<Player, Root, Memory>({
  rules: Object.fromEntries(
    Object.entries(RULES).map(([k, rule]) => [
      k,
      (o: any, ctx: any) => {
        current = seatWeights(ctx.params);
        return rule(o, ctx);
      },
    ]),
  ),
});
