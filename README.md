# Bus

A digital edition of **Bus** (Jeroen Doumen and Joris Wiersinga; Splotter Spellen, Capstone Games) for 3 to 5
players, built on the [Pretty Chitty](https://www.npmjs.com/package/@pretty-chitty/core) board-game engine.
Players choose actions with a dwindling supply of markers: extend a bus line, buy buses, bring in passengers, put
up houses, offices and pubs, stop the clock, and drive people where they want to be at this time of day.

It includes bots for every seat, a live player aid, and a narrated tutorial that plays two full rounds against
two bots. The board art is from the Capstone 20th-anniversary edition; the game itself is © Splotter Spellen /
Capstone Games.

## Running it

```bash
yarn install
yarn start        # hot-reloading playground; read the "Loopback:" line for the port (8080 unless taken)
```

- `/demo` starts a match with you in seat 1 and bots in the others.
- `/demo?tutorial=tutorial` starts the tutorial.

Use yarn, not npm.

## The documents

| File | What it is |
|---|---|
| [RULES.md](RULES.md) | The rules spec. Every rule has an id (VR15, LE22…), and the code cites them. It ends with the open questions and how each was decided. |
| [AUDIT.md](AUDIT.md) | The rule-by-rule audit of the code against `RULES.md`, with where each rule lives. |
| [LAYOUT.md](LAYOUT.md) | The table layout: the panels, what each holds, and how they fold on a phone. |
| [ASSETS.md](ASSETS.md) | Where every image comes from and the scripts that cut them. |
| [TUTORIAL.md](TUTORIAL.md) | The tutorial's lesson plan, and a table showing how each rule is covered. |

The rulings no rulebook settles (unlimited supplies, scores shown in the player bar, and the rest) are in the
open questions at the end of [RULES.md](RULES.md).

## The code

| Path | What it holds |
|---|---|
| `src/Bus.ts` | The game's entry: metadata, theme, bots, tutorial. |
| `src/rules.ts` | What is legal and how much things do (legal streets, building locations, action power, `busPath`). |
| `src/game/flow.ts` | Setup, the rounds, and each action's prompts, in rulebook order. |
| `src/chits/` | One chit per physical component (board, crossings, streets, locations, passengers, markers, buses…). `ChitLibrary.ts` is generated: don't edit it. |
| `src/consts.ts`, `src/geometry/` | Board data read off the printed board (crossings, streets, locations, zones) and its coordinates. |
| `src/ai.ts` | The bots: one scoring rule per `.ai(key)` pick. |
| `src/tutorial/` | The tutorial script, its text (`strings.en.json`), pinned moves and the recorded narration. |

## Checks

Run these after changing rules or the tutorial:

```bash
npx tsc --noEmit -p .
yarn build && node scripts/ai-soak.mjs 20 4 240   # whole games with bots in every seat (try 3 and 5 players too)
yarn tutorial:check                               # plays the tutorial four ways, and checks rule coverage
```

- **Soak:** every game must finish, with no stalls, rule errors or untagged picks.
- **Tutorial check:** it fails on anything a player would hit (a blocked move, a stall, a missing recording, or a
  highlight whose phrase is no longer in the text).
- **Watching it:** `yarn tutorial:trace --frames` prints the tutorial step by step.

## Tutorial narration

The narration is recorded locally and free, with Kokoro's bm_daniel voice on [Voicebox](https://voicebox.sh).
After changing any text in `src/tutorial/strings.en.json`:

```bash
node scripts/tutorial/audio.mjs   # re-records only the steps whose text changed, then aligns them
yarn tutorial:check
```

It needs:
- the Voicebox app open, with "autoplay on generate" turned off;
- `ffmpeg` on your PATH;
- WhisperX in `~/.venvs/whisperx`, for the sentence and word timings and the pauses.

`--preview` prints what will be read aloud. The text on screen and what the voice says can differ:
- `pronounce` respells words for the voice ("Vrrooomm" is read as "Vroom");
- space letters are spoken as "eigh", "bee" and "eff";
- quote marks are dropped;
- `narrator.pauses` adds silence at colons and sentence ends, which Kokoro barely pauses at.

The options are described at the top of `scripts/tutorial/audio.mjs`.

## Bots and tuning

`src/ai.ts` holds hand-written heuristics, with weights tuned by self-play:
- `scripts/tune/run.mjs` evolves the weights;
- `scripts/tune/validate.mjs` plays bots head to head and writes a report to `results/`.

## Art

The board art and pieces are cut from the publisher's files by `scripts/geometry/build_board.py` and
`scripts/art/build_board_art.py`. A bad crop is fixed by editing the script and running it again. See
[ASSETS.md](ASSETS.md).

## Publishing

`yarn deploy` bumps the patch version, builds, uploads `dist/`, and rewrites `publishedGame.json`. It needs FTP
settings in `.ftpSettings.json`, which is git-ignored and must stay that way.
