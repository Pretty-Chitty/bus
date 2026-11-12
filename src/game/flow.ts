// The game, in the rulebook's order. Rule ids refer to RULES.md.
import { Chit, Turn } from "@pretty-chitty/core";
import { Street } from "../chits/Street";
import { Root } from "../chits/Root";
import { Player } from "../chits/Player";
import { ActionMarker } from "../chits/ActionMarker";
import { BusToken } from "../chits/BusToken";
import { Building } from "../chits/Building";
import { Passenger } from "../chits/Passenger";
import { LineMarker } from "../chits/LineMarker";
import { TimeStone } from "../chits/TimeStone";
import { StartBus } from "../chits/StartBus";
import { ActionSpace } from "../chits/ActionSpace";
import { Crossing } from "../chits/Crossing";
import { Location } from "../chits/Location";
import { BuildingOption } from "../chits/BuildingMenu";
import { STONE_SPACES } from "../geometry/board";
import { BuildingsButton, LetTimeRunButton, PassButton } from "../ButtonLibrary";
import {
  ACTION_IDS,
  ACTION_MARKERS_PER_PLAYER,
  ACTIONS,
  ActionId,
  BUILDING_NAME,
  BUILDING_PLURAL,
  BUS_TOKENS_PER_PLAYER,
  BuildingKind,
  LETTERS,
  PASSENGERS_TOTAL,
  PLAYER_COLORS,
  ROUNDABOUT_IDS,
  STATION_IDS,
  nextClock,
  timeStonesFor,
} from "../consts";
import {
  Expansion,
  actionPower,
  busesOf,
  canBuyBus,
  clockKind,
  extendRoute,
  freeBuildingsAt,
  legalBuildingLocations,
  legalExpansions,
  ambiguousEnds,
  maxBuses,
  nextFreeSpaces,
  openZone,
  resolutionOrder,
  vroomOptions,
  busPath,
  finalStandings,
} from "../rules";

type AnyTurn = Turn<any, Player, Root>;

/** Log name of an action space: "Line Expansion (B)", "Buses". */
function spaceName(s: ActionSpace) {
  const def = ACTIONS[s.action];
  return def.multi ? `${def.name} (${s.letter})` : def.name;
}
function ownerOf(root: Root, chit: { colorIndex: number }) {
  return root.players.find((p) => p.colorIndex === chit.colorIndex)!;
}
/** Every answer changes some state, so the server always sees the reply land. */
function answered(p: Player) {
  p.answers++;
}

// ================================================================== setup (S1–S8)
export async function setupGame(turn: AnyTurn, root: Root) {
  const players = root.players.copy();
  const board = root.mainBoard;
  board.build();
  board.clockHand.position = "house"; // S5
  // S3–S4: the time stones (3 players: 4; which space stays empty does not matter)
  const n = timeStonesFor(players.length);
  board.stoneSpaces.copy().forEach((sp, i) => {
    if (i < n) sp.stone = new TimeStone().set((t) => (t.glass = STONE_SPACES[i].glass));
  });
  players.forEach((p, i) => {
    // S1: colour, 20 action markers, 5 buses (S6: one in the depot)
    p.colorIndex = i;
    p.color = PLAYER_COLORS[i].hex;
    for (let k = 0; k < ACTION_MARKERS_PER_PLAYER; k++) p.markers.add(new ActionMarker().set((m) => (m.colorIndex = i)));
    for (let k = 0; k < BUS_TOKENS_PER_PLAYER - 1; k++) p.buses.add(new BusToken().set((b) => (b.colorIndex = i)));
    board.depotColumn(i)[0].bus = new BusToken().set((b) => (b.colorIndex = i));
    p.score = 0; // S2
    p.busCount = 1;
    p.syncSparks();
  });
  // S7: one passenger on each roundabout beside Central Park; the rest are the supply (C5)
  for (const id of ROUNDABOUT_IDS) board.crossing(id).passengers.add(new Passenger());
  board.setSupply(PASSENGERS_TOTAL - ROUNDABOUT_IDS.length);
  board.pointAt(undefined);
  // S8: a random starting player takes the start-bus
  const start = Math.floor((await turn.rng("choose a starting player")) * players.length);
  players[start].startBus = new StartBus();
  turn.log(`${players[start].logKey} starts, with the start-bus.`);
}

export function startIndex(root: Root) {
  return root.players.findIndex((p) => !!p.startBus);
}
/** Players in turn order (clockwise) beginning with `from`. */
function clockwise(root: Root, from: number): Player[] {
  const ps = root.players.copy();
  return ps.map((_, k) => ps[(from + k) % ps.length]);
}

// ================================================================== placing pieces
/** Choose a kind of building in the strip, then click a free location for it (BD3–BD5, FB1–FB4). The supply is
 *  unlimited (C8, Q8), so there is no pile to take from. Returns undefined if no location is free. */
async function placeBuilding(turn: AnyTurn, root: Root, p: Player, message: string, aiKey: string): Promise<BuildingKind | undefined> {
  const targets = legalBuildingLocations(root);
  if (!targets.length) return undefined;
  const board = root.mainBoard;
  const zone = openZone(root);
  let option: BuildingOption | undefined;
  let where: Location | undefined;
  turn.markZipStartPoint();
  await turn.pick(
    message,
    `Choose a house, an office or a pub, then the free zone ${zone} location it goes on. Each location holds one building; a higher zone opens only when every lower one is full.`,
    [
      Chit.pick(board.buildingMenu.options.copy(), (o: BuildingOption) => {
        option = o;
        board.placing = o.kind;
      })
        .toggleButton(new BuildingsButton())
        .focus(board)
        .ai(`${aiKey}.kind`),
    ],
  );
  answered(p);
  const name = BUILDING_NAME[option!.kind];
  await turn.pick(
    `place the ${name} on a free zone ${zone} location`,
    `Click a free zone ${zone} location for the ${name}. Undo to choose another kind.`,
    [
      Chit.pick(targets, (l: Location) => {
        where = l;
      })
        .context(option!)
        .focus(board)
        .ai(aiKey),
    ],
  );
  answered(p);
  where!.building = new Building().set((x) => (x.kind = option!.kind));
  board.placing = "";
  turn.flush();
  turn.zip();
  return option!.kind;
}

/** Click a legal street for the player's next line marker (FL, LE). */
async function placeLineMarker(turn: AnyTurn, root: Root, p: Player, aiKey: string, source?: ActionSpace): Promise<boolean> {
  const options = legalExpansions(root, p);
  if (!options.length) return false;
  turn.markZipStartPoint();
  const streets = [...new Set(options.map((o) => o.street))];
  let dropped: Street | undefined;
  const first = p.route.length === 0;
  await turn.pick(
    first ? "choose a street for their first line marker" : "choose a street at an end of their line",
    first
      ? "Your bus line starts here. Any street will do, even one another line already uses."
      : "Extend from either end of your line, onto an empty street where that end has one. With no empty street at an end, you may run alongside another line; where your end meets another player's end, you may run alongside their line for one street. Never alongside your own.",
    [
      Chit.pick(streets, (s: Street) => {
        dropped = s;
      })
        .focus(root.mainBoard)
        .ai(aiKey),
    ],
  );
  answered(p);
  const here = options.filter((o) => o.street === dropped);
  let chosen: Expansion = here[0];
  if (here.length > 1) {
    // LE23: a street joining both ends closes the line into a circle; the player says which end it grew from
    const board = root.mainBoard;
    await turn.pick(
      "choose the crossing where their line now ends",
      "This street joins both ends of your line, closing a circle. Both ends are now at one crossing; you choose which, and you will extend from there.",
      [
        Chit.pick(
          here.map((o) => board.crossing(o.to)),
          (c: Crossing) => {
            chosen = here.find((o) => o.to === c.crossingId)!;
          },
        )
          .focus(root.mainBoard)
          .ai("line.end"),
      ],
    );
    answered(p);
  }
  dropped!.markers.add(new LineMarker().set((m) => (m.colorIndex = p.colorIndex)));
  extendRoute(p, chosen);
  syncEnds(root, p, source);
  turn.flush();
  turn.zip();
  return true;
}

/** LE16: a spent action marker on each end that touches another part of the line; back to the box once the end
 *  has moved on to an unambiguous crossing. The marker is the one just spent on this Line Expansion. */
function syncEnds(root: Root, p: Player, source?: ActionSpace) {
  const board = root.mainBoard;
  const need = ambiguousEnds(p);
  const have = board.roads.crossings.copy().flatMap((c) => c.ends.filter((m) => m.colorIndex === p.colorIndex).map((m) => ({ c, m })));
  const keep = new Set<ActionMarker>();
  for (const id of need) {
    const there = have.find((h) => h.c.crossingId === id && !keep.has(h.m));
    if (there) keep.add(there.m);
  }
  for (const h of have) if (!keep.has(h.m)) h.m.removeFromParent(); // back to the box
  for (const id of need) {
    const marked = board.crossing(id).ends.filter((m) => m.colorIndex === p.colorIndex).length;
    const wanted = need.filter((x) => x === id).length;
    for (let k = marked; k < wanted; k++) {
      const m = source?.marker ?? new ActionMarker().set((x) => (x.colorIndex = p.colorIndex));
      board.crossing(id).ends.add(m);
    }
  }
}

// ================================================================== the first buildings and lines (FB, FL)
/** Dev only: `?quick` in the playground URL lays the opening for everyone, so captures reach round 1.
 *  Inert anywhere without a browser location. */
export function devQuick(): boolean {
  return typeof window !== "undefined" && /[?&](quick|scene=)/.test(window.location?.search ?? "");
}
/** Dev only: `?scene=vroom` (or lineExpansion, passengers, buildings, clock, buses, startingPlayer) lays the
 *  opening, sets the board up for that action, and gives every seat a marker on it in round 1, so the demo
 *  walks straight to its prompt. */
export function devScene(): ActionId | undefined {
  if (typeof window === "undefined") return undefined;
  const m = /[?&]scene=(\w+)/.exec(window.location?.search ?? "");
  return m && (ACTION_IDS as readonly string[]).includes(m[1]) ? (m[1] as ActionId) : undefined;
}
function sceneSetup(turn: AnyTurn, root: Root, action: ActionId) {
  const board = root.mainBoard;
  if (action === "vroom") {
    // the clock will turn to the office: put an office and two waiting passengers on every line
    for (const p of root.players.copy()) {
      const free = board.locations.find((l) => !l.building && p.route.slice(1).includes(l.crossingId));
      if (free) free.building = new Building().set((b) => (b.kind = "office"));
      for (let k = 0; k < 2 && board.supply > 0; k++) {
        board.crossing(p.route[0]).passengers.add(new Passenger());
        board.setSupply(board.supply - 1);
      }
    }
  }
  if (action === "lineExpansion" || action === "passengers" || action === "buildings") {
    // four buses each, so every space (A–D) does something
    for (const p of root.players.copy()) {
      for (let k = 1; k < 4; k++) board.depotColumn(p.colorIndex)[k].bus = p.buses.last()!;
      p.busCount = busesOf(root, p);
      p.syncSparks();
    }
  }
  turn.log(`(dev) Scene: ${ACTIONS[action].name}.`);
}
function quickOpening(turn: AnyTurn, root: Root) {
  const order = clockwise(root, startIndex(root));
  const kinds: BuildingKind[] = ["house", "office", "pub"];
  let k = 0;
  for (const p of order)
    for (let i = 0; i < 2; i++) {
      const loc = legalBuildingLocations(root)[(k * 5) % legalBuildingLocations(root).length];
      loc.building = new Building().set((b) => (b.kind = kinds[k++ % 3]));
    }
  for (const pass of [order, order.slice().reverse()])
    for (const p of pass) {
      const opts = legalExpansions(root, p);
      const e = opts[(p.colorIndex * 17 + pass.length) % opts.length];
      const m = new LineMarker().set((x) => (x.colorIndex = p.colorIndex));
      e.street.markers.add(m);
      extendRoute(p, e);
    }
  turn.log("(dev) Opening laid automatically.");
}

export async function firstBuildings(turn: AnyTurn, root: Root) {
  if (devQuick()) return quickOpening(turn, root);
  for (const p of clockwise(root, startIndex(root))) {
    await turn.createTurn([root], p, async (t) => {
      const kinds: string[] = [];
      for (let k = 0; k < 2; k++) {
        const kind = await placeBuilding(t, root, p, `choose a building to erect (${k + 1} of 2)`, "setup.building");
        if (kind) kinds.push(kind);
      }
      t.log(`${p.logKey} erects ${kinds.map((k) => (k === "office" ? "an " : "a ") + k).join(" and ")}.`);
    });
  }
}

export async function firstLines(turn: AnyTurn, root: Root) {
  if (devQuick()) return;
  const order = clockwise(root, startIndex(root));
  for (const p of order) {
    await turn.createTurn([root], p, async (t) => {
      await placeLineMarker(t, root, p, "setup.line");
      t.log(`${p.logKey} lays their first line marker.`);
    });
  }
  // FL3–FL4: in reverse order, the last player first
  for (const p of order.slice().reverse()) {
    await turn.createTurn([root], p, async (t) => {
      if (await placeLineMarker(t, root, p, "setup.line2")) t.log(`${p.logKey} lays their second line marker.`);
      else t.log(`${p.logKey} has no street for a second line marker.`);
    });
  }
}

// ================================================================== a round: choose actions (CA)
export async function chooseActions(turn: AnyTurn, root: Root) {
  root.round++;
  root.playerAid.round = root.round;
  const players = root.players.copy();
  const scene = root.round === 1 ? devScene() : undefined;
  if (scene) {
    sceneSetup(turn, root, scene);
    for (const p of players) {
      const s = root.mainBoard.spacesOf(scene).find((x) => !x.marker);
      if (s) s.marker = p.markers.last()!;
      const v = root.mainBoard.spacesOf("vroom").find((x) => !x.marker);
      if (scene !== "vroom" && v) v.marker = p.markers.last()!;
      p.syncSparks();
      p.passed = true;
    }
    turn.flush();
    return;
  }
  // Q3b: a start-bus held by a player who is out passes left to the next player with markers
  passStartBusPastPlayersWhoAreOut(root, turn);
  for (const p of players) {
    p.placedThisRound = 0;
    p.passed = p.markers.length === 0; // CA11
  }
  turn.log(`Round ${root.round}.`);
  let i = startIndex(root);
  while (players.some((p) => !p.passed)) {
    const p = players[i];
    i = (i + 1) % players.length;
    if (p.passed) continue;
    const spaces = nextFreeSpaces(root);
    if (p.markers.length === 0 || spaces.length === 0) {
      p.passed = true; // CA10–CA11: nothing left to place
      continue;
    }
    const mustPlace = p.placedThisRound < 2; // CA1, CA4, CA8
    await turn.createTurn([root], p, async (t) => {
      await t.pick([
        Chit.pick(spaces, (s: ActionSpace) => {
          const m = p.markers.last()!;
          s.marker = m;
          p.placedThisRound++;
          if (p.markers.length === 0) p.passed = true; // Q2: a player who runs out must pass
          p.syncSparks();
          t.log(`${p.logKey} chooses ${spaceName(s)}.`);
        })
          .message(mustPlace ? `choose an action (${p.placedThisRound + 1} of at least 2)` : "choose another action, or pass")
          .help(
            "Place an action marker on an action. Each action resolves from top to bottom once everyone has passed. You must choose at least two each round; markers are spent for good.",
          )
          .focus(root.mainBoard)
          .ai("choose.action"),
        !mustPlace &&
          new PassButton(() => {
            p.passed = true;
            t.log(`${p.logKey} passes.`);
          })
            .pick()
            .ai("choose.pass"),
      ]);
      answered(p);
    });
  }
}

function passStartBusPastPlayersWhoAreOut(root: Root, turn: AnyTurn) {
  const ps = root.players.copy();
  let i = startIndex(root);
  if (ps[i].markers.length > 0 || !ps.some((p) => p.markers.length > 0)) return;
  let j = i;
  do j = (j + 1) % ps.length;
  while (ps[j].markers.length === 0);
  ps[j].startBus = ps[i].startBus;
  turn.log(`${ps[i].logKey} has no action markers left; the start-bus passes to ${ps[j].logKey}.`);
}

// ================================================================== a round: resolve actions (RA)
export async function resolveActions(turn: AnyTurn, root: Root) {
  for (const action of ACTION_IDS) {
    if (root.endReason) break; // CL8: the space-time continuum has ruptured
    await RESOLVE[action](turn, root);
  }
  root.mainBoard.pointAt(undefined);
  turn.flush();
}

/** The resolving pointer moves to the space being carried out (not a rule: so the table can be followed). */
function point(turn: AnyTurn, root: Root, s: ActionSpace) {
  root.mainBoard.pointAt(s);
  turn.flush();
}

const RESOLVE: Record<ActionId, (turn: AnyTurn, root: Root) => Promise<void>> = {
  // LE1–LE2: F to A; A adds M streets, B M − 1, …; 5 players one more (P5)
  async lineExpansion(turn, root) {
    for (const s of resolutionOrder(root, "lineExpansion")) {
      point(turn, root, s);
      const p = ownerOf(root, s.marker!);
      const n = actionPower(root, s);
      if (n <= 0) {
        turn.log(`${p.logKey}'s ${spaceName(s)} adds no streets (most buses: ${maxBuses(root)}).`);
        turn.flush();
        continue;
      }
      await turn.createTurn([root], p, async (t) => {
        let k = 0;
        for (; k < n; k++) if (!(await placeLineMarker(t, root, p, "line.place", s))) break; // RA6
        t.log(
          k === n
            ? `${p.logKey} extends their line by ${k} ${k === 1 ? "street" : "streets"}.`
            : `${p.logKey} extends their line by ${k} of ${n} streets: no legal street is left.`,
        );
      });
    }
  },

  // BU1: one more bus in the depot; MB4 raises the maximum at once
  async buses(turn, root) {
    for (const s of resolutionOrder(root, "buses")) {
      point(turn, root, s);
      const p = ownerOf(root, s.marker!);
      if (!canBuyBus(root, p)) {
        turn.log(`${p.logKey} already has every bus.`);
        continue;
      }
      const slot = root.mainBoard.depotColumn(p.colorIndex).find((d) => !d.bus)!;
      slot.bus = p.buses.last()!;
      p.busCount = busesOf(root, p);
      p.syncSparks();
      turn.flush();
      turn.log(`${p.logKey} buys a bus (${busesOf(root, p)} now; most buses: ${maxBuses(root)}).`);
    }
  },

  // PA1–PA6: A first; new passengers to the stations
  async passengers(turn, root) {
    const board = root.mainBoard;
    for (const s of resolutionOrder(root, "passengers")) {
      point(turn, root, s);
      const p = ownerOf(root, s.marker!);
      const n = actionPower(root, s);
      if (n <= 0 || board.supply === 0) {
        turn.log(`${p.logKey}'s ${spaceName(s)} brings no passengers${board.supply === 0 ? " (the supply is empty)" : ""}.`);
        turn.flush();
        continue;
      }
      await turn.createTurn([root], p, async (t) => {
        let k = 0;
        for (; k < n && board.supply > 0; k++) {
          let to: Crossing | undefined;
          t.markZipStartPoint();
          await t.pick(
            `choose a train station for a new passenger (${k + 1} of ${n})`,
            "New passengers arrive by train. Click either station for each; your line need not reach it.",
            [
              Chit.pick(
                STATION_IDS.map((id) => board.crossing(id)),
                (c: Crossing) => {
                  to = c;
                },
              )
                .focus(board)
                .ai("passenger.place"),
            ],
          );
          answered(p);
          to!.passengers.add(new Passenger());
          board.setSupply(board.supply - 1);
          t.flush();
          t.zip();
        }
        t.log(`${p.logKey} brings ${k} :passenger: to the stations${k < n ? " (the supply ran out)" : ""}.`);
      });
    }
  },

  // BD1–BD6: F to A; A erects M buildings, B M − 1, …
  async buildings(turn, root) {
    for (const s of resolutionOrder(root, "buildings")) {
      point(turn, root, s);
      const p = ownerOf(root, s.marker!);
      const n = actionPower(root, s);
      if (n <= 0 || openZone(root) === 0) {
        turn.log(`${p.logKey}'s ${spaceName(s)} erects nothing${openZone(root) === 0 ? " (every location is built)" : ""}.`);
        turn.flush();
        continue;
      }
      await turn.createTurn([root], p, async (t) => {
        const kinds: BuildingKind[] = [];
        for (let k = 0; k < n; k++) {
          const kind = await placeBuilding(t, root, p, `choose a building to erect (${k + 1} of ${n})`, "building.place");
          if (!kind) break;
          kinds.push(kind);
        }
        const count = (["house", "office", "pub"] as const)
          .map((k) => [k, kinds.filter((x) => x === k).length] as const)
          .filter(([, c]) => c > 0)
          .map(([k, c]) => `${c} :${k}:`)
          .join(", ");
        t.log(`${p.logKey} erects ${count || "nothing"}${kinds.length < n ? " — the city is full" : ""}.`);
      });
    }
  },

  // CL1–CL9
  async clock(turn, root) {
    const board = root.mainBoard;
    const chosen = resolutionOrder(root, "clock")[0];
    point(turn, root, chosen ?? board.spacesOf("clock")[0]);
    const before = clockKind(root);
    let stopped = false;
    if (chosen) {
      const p = ownerOf(root, chosen.marker!);
      stopped = await turn.createTurn([root], p, async (t) => {
        const stones = board.stoneSpaces.map((sp) => sp.stone).filter((x): x is TimeStone => !!x);
        let stop = false;
        await t.pick([
          Chit.pick(stones, (st: TimeStone) => {
            stop = true;
            p.stones.add(st);
          })
            .message(`take a time stone to stop time at the ${before}, or let it run to the ${nextClock(before)}`)
            .help("Stopping time keeps passengers wanting the same buildings, but each stone you take is −1 point. When the last stone is taken, the game ends at once.")
            .focus(board)
            .ai("clock.stop"),
          new LetTimeRunButton(() => {
            stop = false;
            board.clockHand.position = nextClock(before);
          })
            .pick()
            .ai("clock.run"),
        ]);
        answered(p);
        return stop;
      });
      if (stopped) turn.log(`${ownerOf(root, chosen.marker!).logKey} stops time at the :${before}: and takes a time stone.`);
      else turn.log(`${ownerOf(root, chosen.marker!).logKey} lets time run: the clock moves to the :${nextClock(before)}:.`);
    } else {
      board.clockHand.position = nextClock(before); // CL5
      turn.flush();
      turn.log(`Nobody stopped the clock: it moves to the :${clockKind(root)}:.`);
    }
    turn.flush();
    // CL8: the last stone taken ends the game at once
    if (board.stoneSpaces.every((sp) => !sp.stone)) {
      root.endReason = "stones";
      turn.log("The last time stone has left the clock: the space-time continuum ruptures and the game ends!");
      return;
    }
    reseat(turn, root);
  },

  // VR1–VR19: A first; each bus carries one waiting passenger to a free building of the clock's kind
  async vroom(turn, root) {
    for (const s of resolutionOrder(root, "vroom")) {
      point(turn, root, s);
      const p = ownerOf(root, s.marker!);
      const buses = busesOf(root, p);
      const first = vroomOptions(root, p, buses);
      if (first.max === 0) {
        turn.log(
          `${p.logKey}'s ${spaceName(s)}: no passenger on their line can reach a free :${clockKind(root)}: on it.`,
        );
        turn.flush();
        continue;
      }
      await turn.createTurn([root], p, async (t) => {
        let carried = 0;
        for (;;) {
          const o = vroomOptions(root, p, buses - carried);
          if (o.max === 0) break;
          const help = `Each bus carries one passenger standing at a crossing on your line to a free ${clockKind(root)} on your line. You must carry as many as you can: ${first.max} this time.`;
          let who: Passenger | undefined;
          let into: Building | undefined;
          // Not zipped: everyone watches the passenger rise, come down and ride. A zip here rewrites history, and a
          // board that is caught up then jumps to the latest moment, skipping the ride.
          const raise = (w: Passenger) => {
            if (who) who.raised = false;
            who = w;
            w.raised = true;
          };
          await t.pick(`pick up a waiting passenger (${carried + 1} of ${first.max})`, help, [
            Chit.pick(o.passengers, raise).focus(root.mainBoard).ai("vroom.passenger"),
          ]);
          t.flush();
          while (!into) {
            const others = o.passengers.filter((w) => w !== who);
            await t.pick(`choose a free ${clockKind(root)} for the passenger`, help, [
              Chit.pick(o.buildings, (b: Building) => {
                into = b;
              })
                .focus(root.mainBoard)
                .ai("vroom.building"),
              ...(others.length ? [Chit.pick(others, raise).ai("vroom.switch")] : []),
            ]);
            t.flush();
          }
          answered(p);
          who!.raised = false;
          t.flush();
          // VR5: the bus drives along the line, a street at a time
          const from = (who!.parent as Crossing).crossingId;
          const to = (into!.parent as Location).crossingId;
          for (const id of busPath(p, from, to).slice(1)) {
            root.mainBoard.crossing(id).passengers.add(who!);
            t.flush();
          }
          into!.passenger = who!;
          carried++;
          score(root, p, 1);
          t.flush();
        }
        t.log(`${p.logKey} runs ${buses === 1 ? "their bus" : `their ${buses} buses`}: ${carried} :passenger: carried, +${carried}.`);
      });
    }
  },

  // SP1–SP2
  async startingPlayer(turn, root) {
    const chosen = resolutionOrder(root, "startingPlayer")[0];
    point(turn, root, chosen ?? root.mainBoard.spacesOf("startingPlayer")[0]);
    const ps = root.players.copy();
    const holder = ps[startIndex(root)];
    if (chosen) {
      const p = ownerOf(root, chosen.marker!);
      if (p !== holder) p.startBus = holder.startBus;
      turn.log(`${p.logKey} takes the start-bus.`);
    } else {
      const next = ps[(startIndex(root) + 1) % ps.length];
      next.startBus = holder.startBus;
      turn.log(`Nobody chose Starting Player: the start-bus passes to ${next.logKey}.`);
    }
    turn.flush();
  },
};

function score(root: Root, p: Player, n: number) {
  p.score += n;
  p.scoreStamp = ++root.scoreClock; // EG7: the disk arrives on top of any already there
  p.syncSparks();
}

/** CL9: passengers whose building no longer matches the clock step out; waiting passengers step into free
 *  buildings of the clock's kind at their crossing, one per building (VR8, VR10, Q14). */
export function reseat(turn: AnyTurn, root: Root) {
  const board = root.mainBoard;
  const k = clockKind(root);
  let changed = false;
  for (const loc of board.locations.copy()) {
    const b = loc.building;
    if (b?.passenger && b.kind !== k) {
      board.crossing(loc.crossingId).passengers.add(b.passenger);
      changed = true;
    }
  }
  if (changed) turn.flush();
  changed = false;
  for (const c of board.roads.crossings.copy()) {
    for (const b of freeBuildingsAt(root, c.crossingId)) {
      const w = c.passengers.last();
      if (!w) break;
      b.passenger = w;
      changed = true;
    }
  }
  if (changed) turn.flush();
}

// ================================================================== end of round and of the game
/** SP3–SP4, EG3–EG4. Returns true when the game is over. */
export function endRound(turn: AnyTurn, root: Root): boolean {
  if (root.endReason) return true;
  for (const s of root.mainBoard.actionSpaces.copy()) if (s.marker) s.marker.removeFromParent(); // SP4: back in the box
  turn.flush();
  if (openZone(root) === 0) root.endReason = "locations"; // EG4
  else if (root.players.filter((p) => p.markers.length > 0).length <= 1) root.endReason = "markers"; // EG3, Q4
  if (root.endReason === "locations") turn.log("Every building location is built: the game ends.");
  if (root.endReason === "markers") turn.log("At most one player has action markers left: the game ends.");
  return !!root.endReason;
}

export { finalStandings };
export { LETTERS };
