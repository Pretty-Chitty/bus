/**
 * What the gallery buttons a step asks the player to tap would open, for headless runs (the
 * harness taps them; in the browser the player does).
 */
export const uiGalleries: { [ui: string]: { of: (root: Root, me: Player) => Chit } } = {
  "button:Hand": { of: (_root, me) => me.hand },
};

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
export const steer: Steer = () => 0;

/** Cue phrases that no sentence contains (see `beats`). */
export const cueProblems: string[] = [];
/** Steps with no narration recording (see `say`). */
export const narrationProblems: string[] = [];

