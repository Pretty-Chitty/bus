// -------------------------------------------------------------------------------------- script ---
function intro(t: Strings, pins: Pins): TutorialSpec<Player, Root> {
  const text = (id: string) => (t.steps as Record<string, string>)[id] ?? `(missing text: ${id})`;
  const hint = (id: string) => (t.hints as Record<string, string>)[id];
  // Narration rendered by scripts/tutorial/audio.mjs (MP3 + exact sentence times). A step without a
  // recording stays silent and is reported by `narrationProblems` (scripts/tutorial `check` fails on it).
  // Until the developer approves the tutorial there is no recording at all: the narrator's provider
  // is "none", each step runs on the engine's reading clock, and nothing is reported missing.
  // Record (system TTS, then ElevenLabs) only once they have signed off on the script.
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
    hint: { after: 12, text: hint(id) ?? "Nova and Orion are still taking their turns." },
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

