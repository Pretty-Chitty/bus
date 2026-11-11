// WORKED EXAMPLE (a finished tutorial from a space-cruise port): copy to src/tutorial/script.ts, keep
// the plumbing, replace the selectors, checks and steps. See README.md in this folder.
import { checks, defineTutorial, ForcedDecision, splitSentences, TutorialSpec, TutorialStep } from "@pretty-chitty/core";
import type { AiOption, Checker, Chit, Cue as CueOf, Focus as FocusOf, TutorialContext } from "@pretty-chitty/core";
import type { Root } from "../chits/Root";
import type { Player } from "../chits/Player";
import pinsJson from "./pins.json";
import en from "./strings.en.json";
import { narration } from "./audio/index";

/**
 * The intro tutorial: a three-player game (you, Mila and Bram), scripted from the first buildings through
 * the second round. Every draw and every bot move is pinned (pins.json, recorded by scripts/tutorial), so the
 * table is the same for everyone and the narration can name streets and crossings.
 */

/**
 * A bot move recorded by the tutorial harness (scripts/tutorial), replayed as a forced move so the
 * bots do exactly what the narration says, whatever the timing. `chit` and `target` are paths
 * (`chitPath`), not ids: chits that exist before the first turn are numbered by walking the tree,
 * and that order differs between builds (the game's webpack/babel build and the harness's esbuild).
 */
export type PinnedMove = { key: string; chit?: string; target?: string; button?: string };

/**
 * Everything random the script relies on, recorded from one headless run and replayed:
 * `setup` — the draws before the first step (the seating shuffle first, then the deal);
 * `steps` — per step, the draws made while it is live; `ai` — per step and bot, every bot move.
 * Regenerate with scripts/tutorial (see its README); never edit by hand.
 */
export type Pins = {
  setup: (number | number[])[];
  steps: { [stepId: string]: (number | number[])[] };
  ai: { [stepId: string]: { [playerId: string]: PinnedMove[] } };
};

/** One locale's texts: step texts (markdown with :tokens:), hints, and how tokens are read aloud. */
type Strings = typeof en;

type Step = TutorialStep<Player, Root>;
type Ctx = TutorialContext<Player, Root>;
type Focus = FocusOf<Player, Root>;
type Cue = CueOf<Player, Root>;

/**
 * Where a chit is, from the root: outlet names, with the index in ordered outlets
 * (`players[1].mat.smallShip`, `players[2].hand.cards[3]`). The same in every build of the game.
 */
export function chitPath(chit: Chit): string {
  const parts: string[] = [];
  for (let c: Chit | undefined = chit; c?.parent; c = c.parent) {
    const outlet = c.parentOutlet;
    if (!outlet) throw new Error(`chit ${c.id} has no outlet: it cannot be pinned by path`);
    const holder = (c.parent as unknown as Record<string, unknown>)[outlet] as { copy?: () => Chit[] } | undefined;
    const index = holder?.copy ? holder.copy().indexOf(c) : -1;
    parts.unshift(index >= 0 ? `${outlet}[${index}]` : outlet);
  }
  return parts.join(".");
}

/** The chit at a `chitPath`, or undefined. */
export function chitAt(root: Root, path: string): Chit | undefined {
  let c: unknown = root;
  for (const part of path.split(".")) {
    const m = /^([^[]+)(?:\[(\d+)\])?$/.exec(part);
    if (!m || !c) return undefined;
    const value = (c as Record<string, unknown>)[m[1]] as { get?: (i: number) => unknown } | undefined;
    c = m[2] !== undefined ? value?.get?.(Number(m[2])) : value;
  }
  return c as Chit | undefined;
}

function forced(moves: PinnedMove[]): ForcedDecision<Player, Root>[] {
  return moves.map((m) => ({
    key: m.key || undefined,
    chit: m.chit ? (root: Root) => chitAt(root, m.chit!) : undefined,
    target: m.target ? (root: Root) => chitAt(root, m.target!) : undefined,
    button: m.button,
  }));
}

// ---------------------------------------------------------------------------------- selectors ---
const board = (root: Root) => root.mainBoard;
const loc = (id: string) => (root: Root) => root.mainBoard.location(id);
const building = (id: string) => (root: Root) => root.mainBoard.location(id).building;
const street = (id: string) => (root: Root) => root.mainBoard.street(id);
const crossing = (id: string) => (root: Root) => root.mainBoard.crossing(id);
/** A building kind in the inline strip (the first half of a placement). */
// Rings on these use `reveal: false`: the strip shows all three, so there is nothing to scroll into view.
const option = (kind: "house" | "office" | "pub") => (root: Root) => root.mainBoard.buildingMenu.options.find((o) => o.kind === kind);
/** The first half of a placement is done: the kind is chosen (or the building already stands). */
const kindChosen = (kind: "house" | "office" | "pub", where: string) =>
  state((root) => root.mainBoard.placing === kind || root.mainBoard.location(where).building?.kind === kind);
// For a drag's `allow`, select the piece by what it is, never by where it is: a drop the guard refuses is
// still made locally on the person's board, so the piece may now sit somewhere else in their view, and a
// selector by place would then refuse their next, correct drop too. Pieces already placed are not
// draggable, so this cannot let a wrong move through.
const anyPassenger = (root: Root) =>
  [
    ...root.mainBoard.roads.crossings.copy().flatMap((c) => c.passengers.copy()),
    ...(root.mainBoard.locations.map((l) => l.building?.passenger).filter(Boolean) as Chit[]),
  ] as Chit[];
const mila = (root: Root) => root.players.get(1)!;
const bram = (root: Root) => root.players.get(2)!;
const zone1 = (root: Root) => root.mainBoard.locations.filter((l) => l.zone === 1);
const roundabouts = (root: Root) => root.mainBoard.roads.crossings.filter((c) => c.kind === "roundabout");
const stations = (root: Root) => root.mainBoard.roads.crossings.filter((c) => c.kind === "station");
const space = (action: string, letter = "A") => (root: Root) => root.mainBoard.spacesOf(action as any).find((s) => s.letter === letter);
const actionRow = (action: string) => (root: Root) => root.mainBoard.spacesOf(action as any);
const allSpaces = (root: Root) => root.mainBoard.actionSpaces.copy();
const myMarkers = (_root: Root, me: Player) => me.markers;
const myBuses = (root: Root, me: Player) => root.mainBoard.depotColumn(me.colorIndex).map((d) => d.bus).filter(Boolean) as Chit[];
const depot = (root: Root) => root.mainBoard.depotSlots.copy();
/** An action's printed name (the Clock's: its dial). */
const labelOf = (action: string) => (root: Root) =>
  action === "clock" ? (root.mainBoard.clockHand as Chit) : root.mainBoard.actionLabels.find((l) => l.action === action);
/** Highlight an action space with its printed name: one box round both, so the camera keeps the name in view
 *  (zoomed onto the space alone, the name was off screen), an arrow at the space and one at the name. */
const named = (action: string, which: string | ((root: Root) => Chit | undefined) = "A", extra: { zoom?: false } = {}) => {
  const sp = typeof which === "string" ? space(action, which) : which;
  return [
    { ring: (root: Root) => [labelOf(action)(root), sp(root)].filter(Boolean) as Chit[], arrow: sp as (root: Root) => Chit, ...extra },
    { arrow: labelOf(action) as (root: Root) => Chit, ...extra },
  ];
};
/** A whole action row with its printed name, the camera left where it is (a quick run through the actions). */
const rowNamed = (action: string) => [
  { ring: (root: Root) => [labelOf(action)(root), ...actionRow(action)(root)].filter(Boolean) as Chit[], arrow: labelOf(action) as (root: Root) => Chit, zoom: false as const },
];
const lineOf = (who: (root: Root, me: Player) => Player) => (root: Root, me: Player) =>
  root.mainBoard.roads.streets.filter((s) => s.markers.some((m) => m.colorIndex === who(root, me).colorIndex));
const myLine = lineOf((_r, me) => me);
const milaLine = lineOf((r) => mila(r));
const bramLine = lineOf((r) => bram(r));
const clockHand = (root: Root) => root.mainBoard.clockHand;
const stones = (root: Root) => root.mainBoard.stoneSpaces.map((s) => s.stone).filter(Boolean) as Chit[];
const passengersAt = (id: string) => (root: Root) => root.mainBoard.crossing(id).passengers.copy();
const startBus = (root: Root) => root.players.copy().map((p) => p.startBus).find(Boolean);

// ------------------------------------------------------------------------------------- checks ---
const hasButton = (ctx: Ctx, label: string) => !!ctx.prompt?.buttons.some((b) => b.label.toLowerCase() === label.toLowerCase());

/** The player pressed the engine's Confirm: one was showing during this step and is gone now. */
function confirmed(hint: string): Checker<Player, Root> {
  let seen: string | undefined;
  const check = ((ctx: Ctx) => {
    if (hasButton(ctx, "Confirm")) {
      seen = ctx.prompt!.id;
      return hint;
    }
    return seen !== undefined && ctx.prompt?.id !== seen ? true : hint;
  }) as Checker<Player, Root>;
  check.reset = (ctx) => {
    seen = hasButton(ctx as Ctx, "Confirm") ? ctx.prompt!.id : undefined;
  };
  return check;
}
const state = (f: (root: Root, me: Player) => boolean) => checks.state<Player, Root>(f);
const builtCount = (n: number) => state((root) => root.mainBoard.locations.filter((l) => !!l.building).length >= n);
const linesLaid = (n: number) => state((root) => root.mainBoard.roads.streets.reduce((s, st) => s + st.markers.length, 0) >= n);
const built = (id: string, kind: string) => state((root) => root.mainBoard.location(id).building?.kind === kind);
const onStreet = (id: string) => state((root, me) => root.mainBoard.street(id).markers.some((m) => m.colorIndex === me.colorIndex));
/** It is my move again (a prompt is showing), in round `n`. */
const myMoveIn = (n: number): Checker<Player, Root> => ((ctx: Ctx) => ctx.root.round >= n && !!ctx.prompt && !hasButton(ctx, "Confirm")) as Checker<Player, Root>;
/** The space a player would take in `action` now (the lowest free letter). */
const nextFree = (action: string) => (root: Root) => root.mainBoard.spacesOf(action as any).find((s) => !s.marker);
const hasPromptless = (_root: Root) => false;
const spaceTaken = (action: string, letter = "A") => state((root) => !!root.mainBoard.spacesOf(action as any).find((s) => s.letter === letter)?.marker);

/**
 * What the gallery buttons a step asks the player to tap would open, for headless runs (the
 * harness taps them; in the browser the player does).
 */
export const uiGalleries: { [ui: string]: { of: (root: Root, me: Player) => Chit } } = {};

/**
 * The bots that may move in a step, for recording a run (scripts/tutorial): any other bot waits,
 * Confirms aside. Replays need no list: a bot waits for the step of its next scripted move.
 */
export const stepActors: Record<string, string[]> = {};
/**
 * While a run is recorded (scripts/tutorial), each bot's free choice is steered: the result is added to the
 * option's score, and -Infinity vetoes it. Use it for what the lesson needs the bots not to do (end the period
 * early, take the card you will need); replays follow the pins, so it only shapes what gets recorded.
 */
export type Steer = (c: { step: string; bot: string; option: AiOption; view: Root; me: Player }) => number;
export const steer: Steer = ({ step, option }) => {
  const o = option as any;
  // Round 1 must teach your first delivery: nobody else takes the Buses or the Clock (so it moves on to the
  // office), and nobody puts an office at your roundabout (it would seat your passenger)
  if (step.startsWith("others-r1") || step.startsWith("others-fb") || step.startsWith("others-fl")) {
    if (o.key === "choose.action" && ["buses", "clock"].includes(o.chit?.action)) return -Infinity;
    if ((o.key === "building.place" || o.key === "setup.building") && o.chit?.crossingId === "X14") return -Infinity;
    if ((o.key === "setup.line" || o.key === "setup.line2" || o.key === "line.place") && ["S21", "S20", "S19", "S28", "S31", "S32"].includes(o.chit?.streetId)) return -Infinity;
  }
  if (step.startsWith("others-r2")) {
    // Bram takes the Clock and lets time run (the clock must reach the pub); nobody takes your Buildings A,
    // Passengers A or the first Vrrooomm!, and nobody builds at your roundabout
    if (o.key === "choose.action" && ["buildings", "passengers"].includes(o.chit?.action) && o.chit?.letter === "A") return -Infinity;
    if (o.key === "choose.action" && o.chit?.action === "vroom" && o.chit?.letter === "A") return -Infinity;
    if (o.key === "choose.action" && o.chit?.action === "clock") return 20;
    if (o.key === "clock.stop") return -Infinity;
    if ((o.key === "building.place" || o.key === "setup.building") && o.chit?.crossingId === "X14") return -Infinity;
    if (o.key === "line.place" && ["S21", "S20", "S19", "S28", "S31", "S32"].includes(o.chit?.streetId)) return -Infinity;
  }
  return 0;
};

/** Cue phrases that no sentence contains (see `beats`). */
export const cueProblems: string[] = [];
/** Steps with no narration recording (see `say`). */
export const narrationProblems: string[] = [];

// -------------------------------------------------------------------------------------- script ---
function intro(t: Strings, pins: Pins): TutorialSpec<Player, Root> {
  const text = (id: string) => (t.steps as Record<string, string>)[id] ?? `(missing text: ${id})`;
  const hint = (id: string) => (t.hints as Record<string, string>)[id];
  // Narration rendered by scripts/tutorial/audio.mjs (MP3 + exact sentence times). A step without a
  // recording stays silent and is reported by `narrationProblems` (scripts/tutorial `check` fails on it).
  // A narrator of "none" means no recording at all: each step runs on the engine's reading clock, and nothing
  // is reported missing. The developer asked for TTS on 2026-11-04: the draft is macOS `say` (Samantha); the
  // ElevenLabs voice comes once they pick one (scripts/tutorial/voices.mjs).
  const silent = (t as { narrator?: { provider?: string } }).narrator?.provider === "none";
  const say = (id: string): Pick<Step, "id" | "text" | "audio" | "sentenceTimes"> => {
    const n = silent ? undefined : narration[t.locale]?.[id];
    if (!n && !silent) narrationProblems.push(`step "${id}" (${t.locale}) has no recording: run scripts/tutorial/audio.mjs`);
    return n ? { id, text: text(id), audio: n.url, sentenceTimes: n.sentenceTimes } : { id, text: text(id) };
  };
  /** A step that waits for the bots: they play, you watch. */
  const othersStep = (id: string, waitFor: Checker<Player, Root>, extra: Partial<Step> = {}): Step => ({
    ...say(id),
    allow: [],
    waitFor,
    hint: { after: 12, text: hint(id) ?? "Mila and Bram are still taking their turns." },
    timeline: "play", // what it waits for only shows once the board has caught up
    ...extra,
  });
  /** A step that asks you to do one thing. */
  const doIt = (id: string, allow: Step["allow"], waitFor: Checker<Player, Root>, extra: Partial<Step> = {}): Step => ({
    ...say(id),
    allow,
    waitFor,
    hint: { after: 8, text: hint(id) ?? "" },
    timeline: "play", // your prompt only shows once the board has caught up
    ...extra,
  });
  /**
   * Highlights that follow the narration, one beat per sentence: each beat starts at the sentence
   * that contains its phrase (the first beat, with phrase "", at the start). Phrases rather than
   * sentence numbers, so editing a text cannot silently shift its highlights; a phrase that is no
   * longer in the text is reported by `cueProblems` (scripts/tutorial `check` fails on it).
   */
  /** The sentence of step `id` that contains `phrase` (see `beats`). */
  const at = (id: string, phrase: string): { sentence: number } => {
    const i = splitSentences(text(id)).findIndex((x) => x.includes(phrase));
    if (i < 0) cueProblems.push(`step "${id}": no sentence contains "${phrase}"`);
    return { sentence: Math.max(0, i) };
  };
  /**
   * When `word` is spoken in step `id` (its `nth` occurrence, 0-based): the second it starts, from
   * the recording's word times, or else on the engine's reading clock (3 words a second, spread over
   * the sentences by length, as it times sentence cues). For cues inside a sentence ("Launch,
   * Advertise…"). Falling back to the word's sentence instead would fire every cue of a sentence at
   * once, so a silent tutorial (before the recording) could never walk through several things.
   */
  const onWord = (id: string, word: string, nth = 0): number | { sentence: number } => {
    const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    const hits = ((silent ? undefined : narration[t.locale]?.[id]?.words) ?? []).filter(([w]) => norm(w) === norm(word));
    if (hits[nth]) return hits[nth][1];
    const sentences = splitSentences(text(id));
    const joined = sentences.join("");
    // whole words only, a hyphenated one counting as one ("sixty-four" is not "four"), as in the recording
    const re = new RegExp(`(?<![\\p{L}\\p{N}-])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}-])`, "giu");
    const found = [...joined.matchAll(re)][nth];
    if (!found) {
      cueProblems.push(`step "${id}": no word "${word}" (occurrence ${nth})`);
      return { sentence: 0 };
    }
    const words = text(id).split(/\s+/).filter((w) => w).length;
    return (found.index! / joined.length) * Math.max(1, words / 3);
  };
  const beats = (id: string, list: [string, Focus[], Partial<Cue>?][]): Pick<Step, "focus" | "cues"> & Partial<Step> => {
    const sentences = splitSentences(text(id));
    const cues: Cue[] = [];
    let focus: Focus[] | undefined;
    // The first beat's extras (a hold, a gallery) apply from the step's start, so they go on the step:
    // dropping them silently loses a bot step's opening hold (Eclipse; Food Chain Magnate)
    let first: Partial<Cue> | undefined;
    for (const [phrase, f, extra] of list) {
      if (phrase === "") {
        focus = f;
        first = extra;
        continue;
      }
      const at = sentences.findIndex((x) => x.includes(phrase));
      if (at < 0) cueProblems.push(`step "${id}": no sentence contains "${phrase}"`);
      // two beats on one sentence: the second replaces the first at once, so the first is never seen
      else if (cues.some((c) => (c.at as { sentence: number }).sentence === at) || (at === 0 && focus))
        cueProblems.push(`step "${id}": "${phrase}" is in the same sentence as another beat (merge them, or use onWord)`);
      else if (at === 0 && !focus && !extra) focus = f;
      else cues.push({ at: { sentence: at }, focus: f, ...extra });
    }
    return { ...(first as Partial<Step>), focus: focus ?? [], cues };
  };
  /** When cue time `a` falls in step `id`: seconds, from the recording or the reading clock (as `onWord`). */
  const seconds = (id: string, a: number | { sentence: number }): number => {
    if (typeof a === "number") return a;
    const recorded = silent ? undefined : narration[t.locale]?.[id]?.sentenceTimes?.[a.sentence];
    if (recorded !== undefined) return recorded;
    const sentences = splitSentences(text(id));
    const before = sentences.slice(0, a.sentence).join("").length;
    return (before / sentences.join("").length) * Math.max(1, text(id).split(/\s+/).filter((w) => w).length / 3);
  };
  /**
   * `beats` plus highlights on spoken words (`onWord`), for a sentence that walks through several
   * things one at a time ("one at the bottom-left, two at the bottom-right…"). The cues stay in time
   * order: a jump to the end (or Back) applies them in array order, so the last one must be last.
   */
  const beatsAndWords = (id: string, list: Parameters<typeof beats>[1], words: [number | { sentence: number }, Focus[]][]) => {
    const b = beats(id, list);
    const cues = [...(b.cues ?? []), ...words.map(([a, focus]): Cue => ({ at: a, focus }))];
    return { ...b, cues: cues.map((c, i) => ({ c, i })).sort((x, y) => seconds(id, x.c.at) - seconds(id, y.c.at) || x.i - y.i).map((x) => x.c) };
  };
  // No step pauses the bots: each waits for the step that scripts its next move (pins), and their
  // Confirms go through whenever they come, so a turn can end behind any step.
  const narrate = (id: string, extra: Partial<Step> = {}): Step => ({ ...say(id), ...extra });
  // ---- the board's timeline: show each thing while it is said ------------------------------------
  // The board plays the game one moment at a time; a step or a beat can play it up to a moment and
  // hold it there (`timeline`), so a bot's move, a ship's arrival or a guest's bonus is on screen,
  // and ringed, while Zoë explains it. Checks read the board as shown.
  /**
   * A log line the board has shown since the step (or the timeline command) began. Not for a bot's
   * last move before another player's part: a moment shows the latest line written before it, so
   * that line is replaced by the next part's first one and never shows (use `since`).
   */
  const logged = (re: RegExp) => checks.logged<Player, Root>(re);
  /** `done(before, now)` holds for a value read on the board, `before` read when the step (or the
   *  timeline command) began */
  const since = <T,>(read: (root: Root, me: Player) => T, done: (before: T, now: T) => boolean): Checker<Player, Root> => {
    let before: T | undefined;
    const check = ((ctx: Ctx) => before !== undefined && done(before, read(ctx.root, ctx.me))) as Checker<Player, Root>;
    check.reset = (ctx) => {
      before = read(ctx.root, ctx.me);
    };
    return check;
  };
  const grew = (read: (root: Root, me: Player) => number) => since(read, (b, n) => n > b);
  /** Play the board on to the first moment that passes `check`, and hold it there */
  const upTo = (check: Checker<Player, Root>) => ({ timeline: { until: check } });
  /**
   * A bot's part of the turn, watched as it happens: the board plays its moves and holds on the last
   * one (`last`) while the narration explains them. Only that bot moves meanwhile (`stepActors`:
   * recorded, its moves are pinned to this step, and a replay holds the others until their own).
   */
  const watch = (id: string, bot: "p1" | "p2", last: Checker<Player, Root>, extra: Partial<Step> = {}): Step => {
    stepActors[id] = [bot];
    const step = othersStep(id, last, { ...upTo(last), ...extra });
    // Whatever order the beats fire in, the board must end up on the moment the step waits for
    const commands = [step.timeline, ...(step.cues ?? []).map((c) => c.timeline)].filter(Boolean);
    const final = commands[commands.length - 1] as { until?: unknown } | undefined;
    if (final?.until !== last) cueProblems.push(`step "${id}": its last timeline command must play the board up to the moment it waits for`);
    return step;
  };
  const confirm = (id: string, extra: Partial<Step> = {}): Step =>
    doIt(id, { button: "Confirm" }, confirmed(hint(id) ?? "Tap Confirm."), { focus: [{ arrow: { ui: "button:Confirm" } }], box: { anchor: "top-right" }, ...extra });

  // The moments the rounds end on: exact (a round number), so every timing holds the same one
  // ("or later": the engine's runTutorial reads the live game, which may already be past it; a hold still
  // lands on the first moment that passes)
  const r1Start = state((root) => (root.round === 1 && !!bram(root).startBus) || root.round >= 2);
  const r2Start = state((root, me) => (root.round === 2 && !!me.startBus) || root.round >= 3);
  const steps: Step[] = [
    // ------------------------------------------------------------------ the goal and the city
    narrate("welcome", { box: { anchor: "center" }, focus: [{ ring: board, reveal: true }] }),
    narrate("goal", { focus: [{ arrow: { ui: (_root: Root, me: Player) => `spark:${me.scoreSpark.id}` } }] }),
    // The whole network flashes for "This is the city", then one sample street and one sample crossing: rings on
    // every crossing at once mean nothing from far away (the developer).
    narrate(
      "map",
      beatsAndWords(
        "map",
        [
          ["", [{ ring: (root) => [...root.mainBoard.roads.streets.copy(), ...root.mainBoard.roads.crossings.copy()], zoom: false }]],
          ["Your company", [{ ring: (root) => [street("S21")(root), crossing("X09")(root), crossing("X14")(root)], arrow: true, zoom: false }]],
        ],
        [
          [onWord("map", "streets"), [{ ring: street("S21"), arrow: true, zoom: false }]],
          [onWord("map", "crossings"), [{ ring: crossing("X09"), arrow: true, zoom: false }]],
        ],
      ),
    ),
    narrate(
      "locations",
      beats("locations", [
        ["", [{ ring: zone1, separate: true, dim: true }]],
        ["thin line", [{ ring: loc("L101"), arrow: true }, { arrow: crossing("X09") }]],
        ["Zone 2", [{ ring: (root) => root.mainBoard.locations.filter((l) => l.zone === 2), separate: true, dim: true, zoom: false }]],
      ]),
    ),
    narrate(
      "clock",
      beats("clock", [
        ["", [{ ring: clockHand, arrow: true }]],
        ["moves on", [{ ring: clockHand, arrow: true }]],
      ]),
    ),
    narrate(
      "passengers",
      beats("passengers", [
        ["", [{ ring: (root) => roundabouts(root).flatMap((c) => c.passengers.copy()), separate: true, arrow: true, dim: true }]],
        ["11 passengers", [{ arrow: { ui: (root: Root) => `spark:${root.mainBoard.supplySpark.id}` } }]],
        ["train", [{ ring: stations, separate: true, arrow: true }]],
      ]),
    ),
    narrate(
      "tray",
      beats("tray", [
        ["", [{ ring: myMarkers, arrow: true }]],
        ["depot", [{ ring: myBuses, arrow: true }]],
        ["four more", [{ ring: (_root: Root, me: Player) => me.buses.copy(), arrow: true }]],
        ["start-bus", [{ ring: startBus, arrow: true }]],
      ]),
    ),

    // ------------------------------------------------------------------ the first buildings (FB)
    narrate(
      "fb-intro",
      beats("fb-intro", [
        ["", [{ ring: zone1, separate: true }]],
      ]),
    ),
    // Each building is two steps: the kind (box at the top, clear of the strip under the board), then the location
    // (box back at the bottom). One step for both left the box over the strip (the developer: "what am I supposed
    // to do here").
    doIt("fb-office-kind", { key: "setup.building.kind", chit: option("office") }, kindChosen("office", "L101"), {
      box: { anchor: "top" },
      focus: [{ ring: option("office"), arrow: true, reveal: false }],
    }),
    doIt("fb-office", { key: "setup.building", chit: loc("L101") }, built("L101", "office"), {
      box: { anchor: "bottom" },
      ...beats("fb-office", [
        ["", [{ ring: loc("L101"), arrow: true }]],
        ["Modem Road", [{ ring: loc("L101"), arrow: true }, { arrow: street("S21") }]],
      ]),
    }),
    doIt("fb-house-kind", { key: "setup.building.kind", chit: option("house") }, kindChosen("house", "L104"), {
      box: { anchor: "top" },
      focus: [{ ring: option("house"), arrow: true, reveal: false }],
    }),
    doIt("fb-house", { key: "setup.building", chit: loc("L104") }, built("L104", "house"), {
      box: { anchor: "bottom" },
      focus: [{ ring: loc("L104"), arrow: true }],
    }),
    confirm("fb-confirm"),
    watch("others-fb-mila", "p1", builtCount(4), { focus: [{ ring: zone1, separate: true }] }),
    watch("others-fb-bram", "p2", builtCount(6), { focus: [{ ring: zone1, separate: true }] }),

    // ------------------------------------------------------------------ the first lines (FL)
    narrate("fl-intro"),
    doIt("fl-first", { key: "setup.line", chit: street("S21") }, onStreet("S21"), {
      focus: [{ ring: street("S21"), arrow: true }],
    }),
    confirm("fl-confirm"),
    watch("others-fl-mila", "p1", linesLaid(2), { focus: [{ ring: milaLine }] }),
    watch("others-fl-bram", "p2", linesLaid(3), { focus: [{ ring: bramLine }] }),
    narrate("fl-reverse", { focus: [{ ring: myLine, arrow: true }] }),
    watch("others-fl2-bram", "p2", linesLaid(4), { focus: [{ ring: bramLine }] }),
    watch("others-fl2-mila", "p1", linesLaid(5), { focus: [{ ring: milaLine }] }),
    doIt("fl-second", { key: "setup.line2", chit: street("S20") }, onStreet("S20"), {
      focus: [{ ring: street("S20"), arrow: true }],
    }),
    confirm("fl-confirm2"),
    // ------------------------------------------------------------------ round 1: choosing (CA)
    narrate("r1-round", { focus: [{ ring: allSpaces, arrow: true }] }),
    // Each action named once, top to bottom, before any is used (the developer: Passengers was talked about
    // before it had been seen). The first ring frames the action area; each row then keeps that framing.
    narrate(
      "r1-actions",
      beats("r1-actions", [
        ["", [{ ring: (root) => [...allSpaces(root), ...root.mainBoard.actionLabels.copy(), root.mainBoard.clockHand] }]],
        ["Line Expansion", rowNamed("lineExpansion")],
        ["Buses buys", rowNamed("buses")],
        ["Passengers brings", rowNamed("passengers")],
        ["Buildings puts", rowNamed("buildings")],
        ["The Clock", rowNamed("clock")],
        ["Vrrooomm", rowNamed("vroom")],
        ["Starting Player", rowNamed("startingPlayer")],
      ]),
    ),
    narrate(
      "r1-choose",
      beats("r1-choose", [
        ["", [{ ring: myMarkers, arrow: true }]],
        ["lettered", [{ ring: actionRow("vroom"), arrow: true }]],
        ["only one space", [{ ring: (root) => ["buses", "clock", "startingPlayer"].map((a) => space(a)(root)!), separate: true }]],
      ]),
    ),
    doIt("r1-vroom", { key: "choose.action", chit: space("vroom", "A") }, spaceTaken("vroom", "A"), {
      focus: [...named("vroom", "A"), { ring: passengersAt("X14"), arrow: true }],
    }),
    confirm("r1-confirm1"),
    watch("others-r1-mila1", "p1", state((root) => mila(root).placedThisRound >= 1), { focus: [...named("buildings", "A")] }),
    watch("others-r1-bram1", "p2", state((root) => bram(root).placedThisRound >= 1), { focus: [...named("lineExpansion", "A")] }),
    // One box per moment, never two that overlap: a second thing nearby gets an arrow only (the developer: "two
    // overlapping boxes is confusing"). Action spaces are highlighted with their printed name (`named`), so
    // the camera keeps the name in view. Later rings in this step leave the framing alone.
    doIt("r1-buses", { key: "choose.action", chit: space("buses") }, spaceTaken("buses"), {
      ...beats("r1-buses", [
        ["", named("buses")],
        ["Each bus carries", [{ ring: myBuses, arrow: true, zoom: false }]],
        ["Whoever has the most buses", [{ ring: actionRow("passengers"), zoom: false }, { ring: actionRow("buildings"), zoom: false }]],
        ["Space B", [{ ring: space("passengers", "B"), arrow: true, zoom: false }, { ring: space("buildings", "B"), arrow: true, zoom: false }]],
        ["Buses happens before", [...named("buses", "A", { zoom: false })]],
      ]),
    }),
    confirm("r1-confirm2"),
    watch("others-r1-mila2", "p1", state((root) => mila(root).placedThisRound >= 2), { focus: [...named("passengers", "A")] }),
    watch("others-r1-bram2", "p2", state((root) => bram(root).placedThisRound >= 2), { focus: [...named("startingPlayer", "A")] }),
    doIt("r1-pass", { key: "choose.pass" }, state((_root, me) => me.passed), { focus: [{ arrow: { ui: "button:Pass" } }] }),
    confirm("r1-confirm3"),
    othersStep("others-r1-done", state((root) => root.round === 1 && root.players.every((p) => p.passed)), { focus: [{ ring: allSpaces }] }),
    // ------------------------------------------------------------------ round 1: the actions happen (RA)
    watch("others-r1-line", "p2", state((root) => bram(root).route.length >= 4), {
      focus: [...named("lineExpansion", "A"), { ring: bramLine }],
    }),
    othersStep("others-r1-bus", state((root, me) => root.mainBoard.depotColumn(me.colorIndex).filter((d) => !!d.bus).length >= 2), {
      ...upTo(state((root, me) => root.mainBoard.depotColumn(me.colorIndex).filter((d) => !!d.bus).length >= 2)),
      focus: [{ ring: myBuses, arrow: true }],
    }),
    watch("others-r1-passengers", "p1", state((root) => root.mainBoard.supply <= 9), {
      focus: [...named("passengers", "A"), { ring: stations, separate: true }],
    }),
    watch("others-r1-buildings", "p1", builtCount(8), {
      focus: [...named("buildings", "A"), { ring: zone1, separate: true }],
    }),
    othersStep("others-r1-clock", state((root) => root.mainBoard.clockHand.position === "office"), {
      ...upTo(state((root) => root.mainBoard.clockHand.position === "office")),
      focus: [{ ring: clockHand, arrow: true }],
    }),
    othersStep("others-r1-reseat", state((root) => root.mainBoard.locations.some((l) => !!l.building?.passenger)), {
      ...upTo(state((root) => root.mainBoard.locations.some((l) => !!l.building?.passenger))),
      focus: [{ ring: (root) => root.mainBoard.locations.map((l) => l.building?.passenger).filter(Boolean) as Chit[], separate: true, arrow: true }, { arrow: passengersAt("X14") }],
    }),
    // A drag: arrows only, from the passenger and to the building. A box on the piece being dragged follows it
    // about and looks broken (the developer).
    doIt(
      "r1-carry",
      { key: "vroom.move", chit: anyPassenger, target: building("L101") },
      state((_root, me) => me.score >= 1),
      // the round ends with no decision after this: hold its end here, before the board can run past it
      { ...upTo(r1Start), focus: [{ arrow: (root) => passengersAt("X14")(root)[0] }, { arrow: building("L101") }] },
    ),
    watch("others-r1-start", "p2", r1Start, { focus: [...named("startingPlayer"), { ring: startBus, arrow: true }] }),
    narrate("r1-end", { focus: [{ ring: allSpaces }] }),

    // ------------------------------------------------------------------ round 2
    narrate("r2-plan", {
      ...beats("r2-plan", [
        ["", [{ ring: clockHand, arrow: true }]],
        ["sitting in your office", [{ ring: building("L101"), arrow: true }]],
        ["roundabout", [{ ring: (root) => [loc("L102")(root), loc("L103")(root)], separate: true, arrow: true }]],
      ]),
    }),
    watch("others-r2-bram1", "p2", state((root) => root.round === 2 && bram(root).placedThisRound >= 1), { focus: [...named("clock", "A")] }),
    doIt("r2-buildings", { key: "choose.action", chit: nextFree("buildings") }, state((_root, me) => me.placedThisRound >= 1), {
      focus: [...named("buildings", nextFree("buildings"))],
    }),
    confirm("r2-confirm1"),
    watch("others-r2-mila1", "p1", state((root) => root.round === 2 && mila(root).placedThisRound >= 1), { focus: [...named("buses", "A")] }),
    watch("others-r2-bram2", "p2", state((root) => root.round === 2 && bram(root).placedThisRound >= 2), { focus: [...named("lineExpansion", "A")] }),
    doIt("r2-passengers", { key: "choose.action", chit: nextFree("passengers") }, state((_root, me) => me.placedThisRound >= 2), {
      focus: [...named("passengers", nextFree("passengers"))],
    }),
    confirm("r2-confirm2"),
    watch("others-r2-mila2", "p1", state((root) => root.round === 2 && mila(root).placedThisRound >= 2), { focus: [...named("lineExpansion", "B")] }),
    watch("others-r2-bram3", "p2", state((root) => root.round === 2 && (bram(root).placedThisRound >= 3 || bram(root).passed)), { focus: [...named("buildings", "B")] }),
    doIt("r2-vroom", { key: "choose.action", chit: nextFree("vroom") }, state((_root, me) => me.placedThisRound >= 3), {
      focus: [...named("vroom", nextFree("vroom"))],
    }),
    confirm("r2-confirm3"),
    othersStep("others-r2-more", myMoveIn(2), { focus: [{ ring: allSpaces }] }),
    doIt("r2-pass", { key: "choose.pass" }, state((_root, me) => me.passed), { focus: [{ arrow: { ui: "button:Pass" } }] }),
    confirm("r2-confirm4"),
    othersStep("others-r2-done", state((root) => root.round === 2 && root.players.every((p) => p.passed)), { focus: [{ ring: allSpaces }] }),
    // ------------------------------------------------------------------ round 2: the actions happen
    watch("others-r2-line-mila", "p1", state((root) => root.round === 2 && mila(root).route.length >= 4), {
      focus: [...named("lineExpansion", "B"), { ring: milaLine }],
    }),
    watch("others-r2-line-bram", "p2", state((root) => root.round === 2 && bram(root).route.length >= 6), {
      focus: [...named("lineExpansion", "A"), { ring: bramLine }],
    }),
    othersStep("others-r2-bus", state((root) => root.mainBoard.depotColumn(mila(root).colorIndex).filter((d) => !!d.bus).length >= 2), {
      ...upTo(state((root) => root.mainBoard.depotColumn(mila(root).colorIndex).filter((d) => !!d.bus).length >= 2)),
      focus: [{ ring: (root) => root.mainBoard.depotColumn(mila(root).colorIndex).map((d) => d.bus).filter(Boolean) as Chit[], arrow: true }],
    }),
    doIt("r2-pax1", { key: "passenger.place", chit: crossing("X10") }, state((root) => passengersAt("X10")(root).length >= 1), {
      focus: [{ ring: crossing("X10"), arrow: true }],
    }),
    doIt("r2-pax2", { key: "passenger.place", chit: crossing("X10") }, state((root) => passengersAt("X10")(root).length >= 2), {
      focus: [{ ring: crossing("X10"), arrow: true }],
    }),
    confirm("r2-confirm5"),
    watch("others-r2-bram-build", "p2", builtCount(9), { focus: [...named("buildings", "B"), { ring: zone1, separate: true }] }),
    doIt("r2-pub1-kind", { key: "building.place.kind", chit: option("pub") }, kindChosen("pub", "L102"), {
      box: { anchor: "top" },
      focus: [{ ring: option("pub"), arrow: true, reveal: false }],
    }),
    doIt("r2-pub1", { key: "building.place", chit: loc("L102") }, built("L102", "pub"), {
      box: { anchor: "bottom" },
      focus: [{ ring: loc("L102"), arrow: true }],
    }),
    doIt("r2-pub2-kind", { key: "building.place.kind", chit: option("pub") }, kindChosen("pub", "L103"), {
      box: { anchor: "top" },
      focus: [{ ring: option("pub"), arrow: true, reveal: false }],
    }),
    doIt("r2-pub2", { key: "building.place", chit: loc("L103") }, built("L103", "pub"), {
      box: { anchor: "bottom" },
      focus: [{ ring: loc("L103"), arrow: true }],
    }),
    confirm("r2-confirm6"),
    watch("others-r2-clock", "p2", state((root) => root.round === 2 && root.mainBoard.clockHand.position === "pub"), {
      focus: [{ ring: clockHand, arrow: true }, { ring: stones, separate: true }],
    }),
    othersStep("others-r2-reseat", state((root) => passengersAt("X09")(root).length >= 1), {
      ...upTo(state((root) => passengersAt("X09")(root).length >= 1)),
      focus: [{ ring: passengersAt("X09"), arrow: true }, { arrow: crossing("X10") }],
    }),
    doIt("r2-carry1", { key: "vroom.move", chit: anyPassenger, target: building("L102") }, state((_root, me) => me.score >= 2), {
      focus: [{ arrow: (root) => passengersAt("X09")(root)[0] }, { arrow: building("L102") }],
    }),
    doIt("r2-carry2", { key: "vroom.move", chit: anyPassenger, target: building("L103") }, state((_root, me) => me.score >= 3), {
      ...upTo(r2Start),
      focus: [{ arrow: (root) => passengersAt("X10")(root)[0] }, { arrow: building("L103") }],
    }),
    confirm("r2-confirm7", upTo(r2Start)),
    othersStep("others-r2-start", r2Start, { ...upTo(r2Start), focus: [{ ring: startBus, arrow: true }] }),

    // ------------------------------------------------------------------ the rest of the rules
    narrate(
      "close-lines",
      beats("close-lines", [
        ["", [{ ring: myLine, arrow: true }]],
        ["no empty street", [{ ring: (root) => [crossing("X14")(root), crossing("X10")(root)], separate: true, arrow: true }]],
        ["another player's end", [{ ring: bramLine }, { arrow: milaLine }]],
      ]),
    ),
    narrate("close-loops", { focus: [{ ring: myLine, arrow: true }] }),
    narrate(
      "close-zones",
      beats("close-zones", [
        ["", [{ ring: zone1, separate: true, dim: true }]],
        ["zone 2", [{ ring: (root) => root.mainBoard.locations.filter((l) => l.zone === 2), separate: true, dim: true }]],
      ]),
    ),
    narrate(
      "close-end",
      beats("close-end", [
        ["", [{ ring: stones, separate: true, arrow: true }]],
        ["every building location", [{ ring: (root) => root.mainBoard.locations.copy(), separate: true, dim: true, zoom: false }]],
        ["action markers", [{ ring: myMarkers, arrow: true }]],
      ]),
    ),
    narrate("close-score", { focus: [{ arrow: { ui: (_root: Root, me: Player) => `spark:${me.scoreSpark.id}` } }] }),
    narrate("close-aid", { focus: [{ arrow: { ui: (root: Root) => `dropdown:${root.playerAid.id}` } }] }),
    narrate("finish", { box: { anchor: "center" }, end: "continue" }),
  ];
  for (const s of steps) {
    if (pins.steps[s.id]) s.rng = pins.steps[s.id];
    const ai = pins.ai[s.id];
    if (ai) s.ai = Object.fromEntries(Object.entries(ai).map(([id, moves]) => [id, forced(moves)]));
  }
  return defineTutorial<Player, Root>({
    id: "tutorial",
    locale: t.locale,
    title: t.title,
    intro: t.intro,
    theme: { highlightColor: "#9dff3a", highlightGlow: "#9dff3a", arrowColor: "#9dff3a", boxBackground: "#0f2b3cf2", boxTextColor: "#ffffff", accent: "#f5c518" },
    match: {
      players: [{ name: t.you }, { name: "Mila", ai: {} }, { name: "Bram", ai: {} }],
      // The seating shuffle (zeros keep the order), then the deal: the first draw picks the starting player (you)
      rng: pins.setup.length ? pins.setup : [[0, 0, 0, 0, 0, 0], 0],
      ai: { seed: 7, thinkMs: 700 },
    },
    steps,
  });
}

export function buildTutorial(locale: string, pins: Pins): TutorialSpec<Player, Root> {
  void locale; // one locale so far
  return intro(en, pins);
}

export const tutorials: TutorialSpec<Player, Root>[] = [buildTutorial("en", pinsJson as Pins)];
