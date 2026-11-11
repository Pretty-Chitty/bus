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

