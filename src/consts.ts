// Static rulebook data, sizes and colours. Rule ids refer to RULES.md.
import {
  ACTION_SPACES,
  BOARD_PX,
  CROSSINGS,
  DEPOT,
  LOCATIONS,
  STREETS,
} from "./geometry/board";

// ------------------------------------------------------------------ units
/** Board-scan pixels per world unit. The board is 38.94 × 27.53 units. */
export const PX = 100;
export const BOARD_W = BOARD_PX.w / PX;
export const BOARD_H = BOARD_PX.h / PX;
/** A point on the board scan (x right, y down) in board-local world units (y up). */
export function toWorld(x: number, y: number): { x: number; y: number } {
  return { x: (x - BOARD_PX.w / 2) / PX, y: -(y - BOARD_PX.h / 2) / PX };
}

// ------------------------------------------------------------------ players (C10)
/** Player colours, in seat order (the depot's columns, B9). `hex` is the wooden pieces' colour, sampled from
 *  the rulebook's component photo (p.1); the board prints the same colours darker. */
export const PLAYER_COLORS = [
  { name: "purple", hex: "#8a4a86", depot: 0 },
  { name: "blue", hex: "#3a91c6", depot: 1 },
  { name: "green", hex: "#4fb077", depot: 2 },
  { name: "yellow", hex: "#e8b63c", depot: 3 },
  { name: "red", hex: "#dc5446", depot: 4 },
] as const;
export const MIN_PLAYERS = 3; // C11
export const MAX_PLAYERS = 5; // C11
export const ACTION_MARKERS_PER_PLAYER = 20; // C3, S1
export const BUS_TOKENS_PER_PLAYER = 5; // C4, BU4
export const PASSENGERS_TOTAL = 15; // C5
export const START_PASSENGERS = 4; // S7: one on each roundabout
export function timeStonesFor(players: number) {
  return players === 3 ? 4 : 5; // S3, S4
}

// ------------------------------------------------------------------ buildings and the clock
export const BUILDING_KINDS = ["house", "office", "pub"] as const;
export type BuildingKind = (typeof BUILDING_KINDS)[number];
/** B6: the clock turns house → office → pub → house. */
export function nextClock(k: BuildingKind): BuildingKind {
  return BUILDING_KINDS[(BUILDING_KINDS.indexOf(k) + 1) % 3];
}
export const BUILDING_NAME: Record<BuildingKind, string> = {
  house: "house",
  office: "office",
  pub: "pub",
};
export const BUILDING_PLURAL: Record<BuildingKind, string> = {
  house: "houses",
  office: "offices",
  pub: "pubs",
};
/** Disc colours: one hue per kind, none a player colour (the print's three blue-greys could not be told apart
 *  at phone size; the developer). The faces are made with the same colours (scripts/art/build_board_art.py). */
export const BUILDING_COLOR: Record<BuildingKind, string> = {
  house: "#f4efe2",
  office: "#2aa6a0",
  pub: "#8c3a2a",
};

// ------------------------------------------------------------------ actions (B8, CA, RA)
export const ACTION_IDS = [
  "lineExpansion",
  "buses",
  "passengers",
  "buildings",
  "clock",
  "vroom",
  "startingPlayer",
] as const;
export type ActionId = (typeof ACTION_IDS)[number];
export interface ActionDef {
  id: ActionId;
  name: string;
  /** CA5: Buses, Clock and Starting Player have one space; the others A–F. */
  multi: boolean;
  /** RA3/RA4: which end of the row resolves first. "lastChosen" = F…A (Line Expansion, Buildings). */
  order: "firstChosen" | "lastChosen" | "single";
  /** MB3: the quantity dwindles A = M, B = M − 1, … */
  dwindles: boolean;
  short: string;
  rules: string;
}
export const ACTIONS: Record<ActionId, ActionDef> = {
  lineExpansion: {
    id: "lineExpansion",
    name: "Line Expansion",
    multi: true,
    order: "lastChosen",
    dwindles: true,
    short: "Extend your bus line",
    rules:
      "Add streets to your bus line: space A adds one for each bus of whoever has the most buses, B one less, and so on (5 players: one more each). The row runs F to A and happens left to right, so space A comes last.\n\nExtend from either end, onto an empty street if that end has one. With no empty street at an end you may run alongside another line; where your end meets another player's end you may run alongside theirs for one street. Never alongside your own line.",
  },
  buses: {
    id: "buses",
    name: "Buses",
    multi: false,
    order: "single",
    dwindles: false,
    short: "Buy a bus",
    rules:
      "One player per round. Put one more of your buses in the depot. Each bus carries one passenger per Vrrooomm!, and whoever has the most buses sets how much Line Expansion, Passengers and Buildings do, starting with the actions below it this round.",
  },
  passengers: {
    id: "passengers",
    name: "Passengers",
    multi: true,
    order: "firstChosen",
    dwindles: true,
    short: "Bring passengers to the stations",
    rules:
      "Bring new passengers from the supply to the train stations: space A brings one for each bus of whoever has the most buses, B one less, and so on. The row runs A to F and happens left to right, A first. Split them between the two stations as you like; your line need not reach them. When the supply is empty, nothing more arrives.",
  },
  buildings: {
    id: "buildings",
    name: "Buildings",
    multi: true,
    order: "lastChosen",
    dwindles: true,
    short: "Erect buildings",
    rules:
      "Erect houses, offices or pubs (your choice of each): space A erects one for each bus of whoever has the most buses, B one less, and so on. The row runs F to A and happens left to right, so space A comes last. Only zone 1 locations may be used until all are built, then zone 2, then 3, then 4. When no location is left, the game ends after this round.",
  },
  clock: {
    id: "clock",
    name: "Clock",
    multi: false,
    order: "single",
    dwindles: false,
    short: "Stop time, or let it run",
    rules:
      "One player per round. When it resolves you may stop time: take a time stone (−1 point at the end) and the clock stays where it is. Otherwise, or if nobody chose the Clock, it moves on: house → office → pub. If the last stone is taken, the game ends at once.",
  },
  vroom: {
    id: "vroom",
    name: "Vrrooomm!",
    multi: true,
    order: "firstChosen",
    dwindles: false,
    short: "Run your buses and score",
    rules:
      "Each of your buses carries one passenger who wants to get away (one at a crossing without a free building of the kind the clock shows) from a crossing on your line to a free building of that kind on your line. You must carry as many as you can. 1 point per passenger. The row happens left to right, A first; choose it twice to run your buses twice.",
  },
  startingPlayer: {
    id: "startingPlayer",
    name: "Starting Player",
    multi: false,
    order: "single",
    dwindles: false,
    short: "Start next round",
    rules:
      "One player per round. You take the start-bus and choose first next round. If nobody chooses it, the start-bus passes to the left.",
  },
};
export const LETTERS = "ABCDEF";

// ------------------------------------------------------------------ the map (B1–B4), from the generated geometry
export const CROSSING_BY_ID = new Map(CROSSINGS.map((c) => [c.id, c]));
export const STREET_BY_ID = new Map(STREETS.map((s) => [s.id, s]));
/** Streets meeting at each crossing. */
export const STREETS_AT = new Map<string, string[]>(
  CROSSINGS.map((c) => [c.id, []]),
);
for (const s of STREETS) {
  STREETS_AT.get(s.a)!.push(s.id);
  STREETS_AT.get(s.b)!.push(s.id);
}
export function otherEnd(streetId: string, crossing: string): string {
  const s = STREET_BY_ID.get(streetId)!;
  return s.a === crossing ? s.b : s.a;
}
export function streetBetween(a: string, b: string): string | undefined {
  return STREETS_AT.get(a)!.find((s) => otherEnd(s, a) === b);
}
/** Building locations at each crossing. */
export const LOCATIONS_AT = new Map<string, string[]>(
  CROSSINGS.map((c) => [c.id, []]),
);
for (const l of LOCATIONS) LOCATIONS_AT.get(l.crossing)!.push(l.id);
export const STATION_IDS = CROSSINGS.filter((c) => c.kind === "station").map(
  (c) => c.id,
);
export const ROUNDABOUT_IDS = CROSSINGS.filter(
  (c) => c.kind === "roundabout",
).map((c) => c.id);

/** A height layer per street (greedy edge colouring): streets meeting at a crossing never share one, so where
 *  their ends overlap one is always above the other. */
export const STREET_LAYER = new Map<string, number>();
for (const s of STREETS) {
  const used = new Set(
    [...STREETS_AT.get(s.a)!, ...STREETS_AT.get(s.b)!].map((t) =>
      STREET_LAYER.get(t),
    ),
  );
  let k = 0;
  while (used.has(k)) k++;
  STREET_LAYER.set(s.id, k);
}

// Load-time checks against the rulebook and the board (B1–B4, C).
(() => {
  const zones = [1, 2, 3, 4].map(
    (z) => LOCATIONS.filter((l) => l.zone === z).length,
  );
  if (zones.join() !== "12,11,9,15") throw new Error(`zone counts ${zones}`);
  if (STATION_IDS.length !== 2) throw new Error("stations");
  if (ROUNDABOUT_IDS.length !== START_PASSENGERS)
    throw new Error("roundabouts");
  if (DEPOT.length !== 25) throw new Error("depot");
  const rows = ACTION_IDS.map(
    (a) => ACTION_SPACES.filter((s) => s.action === a).length,
  );
  if (rows.join() !== "6,1,6,6,1,6,1") throw new Error(`action spaces ${rows}`);
  if (STREETS.length !== 70 || CROSSINGS.length !== 36)
    throw new Error("map size");
})();

// ------------------------------------------------------------------ sizes (world units; 1 = 100 scan px)
/** Heights of the city map's chits: a base height times a multiplier, so they are easy to tune. */
export const HEIGHT = {
  road: 0.08 * 5, // streets
  crossing: 0.08 * 8, // the dots at the ends of the streets (must stay above every road)
  location: 0.08 * 10, // the numbered building locations
  leader: 0.08 * 3, // the line from each location to its crossing
};
export const SIZE = {
  boardThickness: 0.25,
  roadWidth: 0.38, // the printed white band; the network's shared outline draws its dark edge
  roadH: HEIGHT.road, // plus a small step per depth layer, so no two roads that meet are coplanar
  plainCrossingR: 0.31,
  roundaboutR: 0.56,
  stationR: 1.02,
  crossingThickness: HEIGHT.crossing, // above every road, capping their ends
  locationThickness: HEIGHT.location,
  leaderH: HEIGHT.leader,
  buildingR: 0.4, // a cardboard disc covering its printed location (r ≈ 0.42)
  buildingThickness: 0.1,
  passengerH: 0.82, // about a building disc across, as in the rulebook's figures
  passengerDepth: 0.28,
  lineLength: 1.7, // the shortest street shows 2.07 between its crossings
  lineSection: 0.2, // the stick's height
  lineWidth: 0.4, // across the street: twice the height (the developer: "2x as wide")
  actionMarkerR: 0.27,
  actionMarkerH: 0.3,
  busW: 0.82, // fits the depot's printed inset (85 × 36 px)
  busH: 0.34,
  busZ: 0.28,
  stoneR: 0.42,
  stoneZ: 0.2,
  handLength: 2.55,
  handWidth: 0.34,
  standeeW: 1.6, // the cover's bus, 376 x 241
  standeeH: 1.03,
};
/** zLiftRatio per kind of piece (quality-bar §4). */
export const LIFT = { piece: 0.35, marker: 0.6, stick: 0.3, card: 0.25 };

// ------------------------------------------------------------------ colours
/** The rulebook's magenta transit line (sampled): reads on the action area's white paper, the white roads and the
 *  orange city, and is distinct from every player colour. */
export const CLICK_COLOR = "#eb008c";
export const NAVY = "#1c1c2c"; // the board's road edges and disc colour (sampled)
export const PAPER = "#f7f4eb"; // the road's white (sampled)
export const THEME = {
  ground: "#163a52", // the cover's deep teal-blue
  accent: "#f5c518", // the cover's yellow bus
  actionBar: "#0f5a6e",
};
export const FONT = "Poppins, sans-serif";
