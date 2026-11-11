# Bus — rules conformance audit

Walked `RULES.md` top to bottom against the code (2026-11-04). ✅ implemented · ⚠️ deviates · ❌ missing ·
🎨 deliberate representation choice. Locations are files under `src/`.

## C — Components

| Rule | Status | Location | Note |
|---|---|---|---|
| C1 | ✅ | `chits/MainBoard.ts` | board art + map chits + action area |
| C2 | ✅ | `game/flow.ts` `placeLineMarker` | unlimited (Q7); a fresh marker is made for each placement |
| C3 | ✅ | `game/flow.ts` `setupGame` | 20 per player |
| C4 | ✅ | `game/flow.ts` `setupGame` | 5 per player; one starts in the depot |
| C5 | ✅ | `game/flow.ts` `setupGame` | 15 (4 on roundabouts, 11 in the supply) |
| C6 | 🎨 | `chits/Sparks.ts` | score disks are the points spark (Q1, developer) |
| C7 | ✅ | `game/flow.ts` `setupGame` | 5 glass stones (4 with three players) |
| C8 | ✅ | `chits/BuildingStack.ts` | unlimited per kind (Q8) |
| C9 | ✅ | `chits/StartBus.ts` | a standee of the cover's bus |
| C10 | ✅ | `consts.ts` `PLAYER_COLORS` | purple, blue, green, yellow, red in seat order |
| C11 | ✅ | `chits/Root.ts` | `minPlayers` 3, `maxPlayers` 5 |

## B — Board data

| Rule | Status | Location | Note |
|---|---|---|---|
| B1 | ✅ | `geometry/board.ts` (generated) | 36 crossings, 70 streets, detected and asserted; names read off the board |
| B2 | ✅ | `geometry/board.ts`, `consts.ts` load check | 47 locations, 12/11/9/15, each with its crossing |
| B3 | ✅ | `geometry/board.ts` | 2 stations |
| B4 | ✅ | `geometry/board.ts` | 4 roundabouts |
| B5 | 🎨 | `scripts/art/build_board_art.py` | track painted out; scores are sparks (Q1) |
| B6 | ✅ | `consts.ts` `nextClock`, `geometry/board.ts` `CLOCK` | house → office → pub, angles from the printed spokes |
| B7 | ✅ | `chits/StoneSpace.ts` | 5 printed spaces |
| B8 | ✅ | `consts.ts` `ACTIONS`, `geometry/board.ts` | 27 spaces, letters in printed order |
| B9 | ✅ | `chits/DepotSlot.ts` | 5 × 5 |

## S — Setting up

| Rule | Status | Location | Note |
|---|---|---|---|
| S1 | ✅ | `game/flow.ts` `setupGame` | |
| S2 | ✅ | `game/flow.ts` `setupGame` | score 0 |
| S3 | ✅ | `game/flow.ts` `setupGame` | |
| S4 | ✅ | `consts.ts` `timeStonesFor` | |
| S5 | ✅ | `game/flow.ts` `setupGame` | hand on the house |
| S6 | ✅ | `game/flow.ts` `setupGame` | |
| S7 | ✅ | `game/flow.ts` `setupGame` | one per roundabout (Q14b) |
| S8 | ✅ | `game/flow.ts` `setupGame` | `turn.rng` |

## FB, FL — The first buildings and lines

| Rule | Status | Location | Note |
|---|---|---|---|
| FB1 | ✅ | `game/flow.ts` `firstBuildings` | two each, any kinds |
| FB2 | ✅ | `rules.ts` `legalBuildingLocations` | only the open (lowest) zone |
| FB3 | ✅ | `game/flow.ts` `firstBuildings` | clockwise from the starter; exactly two (Q15) |
| FB4 | ✅ | `rules.ts` `legalBuildingLocations` | free locations only |
| FL1 | ✅ | `game/flow.ts` `firstLines` | |
| FL2 | ✅ | `rules.ts` `legalExpansions` (`first`) | any street |
| FL3–FL4 | ✅ | `game/flow.ts` `firstLines` | reverse order, starter last |
| FL5 | ✅ | `rules.ts` `legalExpansions` | the second marker follows LE |
| FL6 | ✅ | `Bus.ts` `run` | |

## R, CA, RA — The round

| Rule | Status | Location | Note |
|---|---|---|---|
| R1 | ✅ | `Bus.ts` `run` | choose, then resolve |
| CA1, CA4, CA8 | ✅ | `game/flow.ts` `chooseActions` | Pass only after two markers |
| CA2, CA7, CA10 | ✅ | `rules.ts` `nextFreeSpaces` | any number, same action again, only free spaces |
| CA3, CA9 | ✅ | `game/flow.ts` `chooseActions` | clockwise from the start-bus until all pass |
| CA5–CA6 | ✅ | `rules.ts` `nextFreeSpaces` | single spaces; lowest free letter |
| CA11 | ✅ | `game/flow.ts` `chooseActions` | no markers: passed; Q2 (one left: place it, then out); Q3 (still scores) |
| RA1 | ✅ | `game/flow.ts` `resolveActions` | `ACTION_IDS` in board order |
| RA2–RA4 | ✅ | `rules.ts` `resolutionOrder` | F→A for Line Expansion and Buildings, A→F otherwise |
| RA5–RA7 | ✅ | `game/flow.ts` | no skips: each action loops to its full power or until no legal move |

## MB, LE, BU — Buses and lines

| Rule | Status | Location | Note |
|---|---|---|---|
| MB1–MB2 | ✅ | `rules.ts` `busesOf`, `maxBuses` | read from the depot |
| MB3, Q5 | ✅ | `rules.ts` `actionPower` | ≤ 0: nothing, logged |
| MB4 | ✅ | `rules.ts` `actionPower` | read when each space resolves |
| MB5 | ✅ | (restatement of MB3) | |
| LE1–LE2 | ✅ | `game/flow.ts` `RESOLVE.lineExpansion` | |
| LE3 | ✅ | `game/flow.ts` `placeLineMarker` | the player clicks the street |
| LE4 | ✅ | `rules.ts` `legalExpansions` | from either end |
| LE5–LE6 | ✅ | `rules.ts` `legalExpansions` (`empty`) | |
| LE7–LE8, LE24 | ✅ | `rules.ts` `legalExpansions` (`blocked`) | per end |
| LE8a, LE11 | ✅ | (follows: LE5 applies again at the new end) | |
| LE9–LE10, LE13–LE14, LE22 | ✅ | `rules.ts` `legalExpansions` (`meeting`) | the street the other line ends along; every line in it must end here |
| LE12 | ✅ | `rules.ts` `colorOnStreet` | never your own street |
| LE15, LE23 | ✅ | `game/flow.ts` `placeLineMarker` | a street joining both ends asks which crossing the line now ends at |
| LE16 | ✅ | `game/flow.ts` `syncEnds` | the spent marker stands beside each end that touches the line; back to the box when the end moves on. 🎨 If a closed circle needs a second marker, a fresh one stands in |
| LE17, LE21 | ✅ | `rules.ts` `extendRoute` | the route is a trail; it may cross itself |
| LE18 | ✅ | `rules.ts` | follows from `route` |
| LE19 | ✅ | — | nothing removes a line marker |
| LE20 | ✅ | `chits/Player.ts` `route` | |
| BU1–BU2 | ✅ | `game/flow.ts` `RESOLVE.buses` | |
| BU3 | ✅ | `rules.ts` `vroomOptions` | |
| BU4, Q6 | ✅ | `rules.ts` `canBuyBus` | choosing it with five does nothing |

## PA, BD, CL — Passengers, buildings, clock

| Rule | Status | Location | Note |
|---|---|---|---|
| PA1 | ✅ | `game/flow.ts` `RESOLVE.passengers` | |
| PA2–PA5 | ✅ | `game/flow.ts` | the player clicks either station; line need not reach |
| PA6 | ✅ | `game/flow.ts` | empty supply: nothing |
| BD1–BD2 | ✅ | `game/flow.ts` `RESOLVE.buildings` | |
| BD3–BD5 | ✅ | `rules.ts` `legalBuildingLocations` | zones open within an action as they fill |
| BD6, EG4 | ✅ | `game/flow.ts` `endRound` | |
| CL1 | ✅ | single space | |
| CL2–CL4, CL6–CL7 | ✅ | `game/flow.ts` `RESOLVE.clock` | click a stone to stop, or "Let it run" |
| CL5, Q18 | ✅ | `game/flow.ts` `RESOLVE.clock` | moves at the Clock step when nobody chose it |
| CL8, EG2 | ✅ | `game/flow.ts` | the last stone ends the game before Vrrooomm! |
| CL9, Q14 | ✅ | `game/flow.ts` `reseat` | every round at the Clock step |

## VR, SP, EG, P5

| Rule | Status | Location | Note |
|---|---|---|---|
| VR1–VR5 | ✅ | `rules.ts` `vroomOptions` | both ends of the trip on the player's line |
| VR6–VR10, VR20 | ✅ | `game/flow.ts` `reseat` | standing = wants to get away; stations have no buildings |
| VR11–VR15 | ✅ | `rules.ts` `vroomOptions` | the player drags which passenger to which building |
| VR16, Q17 | ✅ | `game/flow.ts` `RESOLVE.vroom` | loops until min(buses, waiting, free) is carried |
| VR17 | ✅ | each space resolves with all the player's buses | |
| VR18–VR19 | ✅ | `game/flow.ts` `score` | +1 each; `scoreStamp` records arrival order |
| SP1–SP2, SP5 | ✅ | `game/flow.ts` `RESOLVE.startingPlayer` | the start-bus moves; Q3b skips a player who is out |
| SP3–SP4 | ✅ | `game/flow.ts` `endRound` | spent markers back to the box |
| EG1 | ✅ | | |
| EG3, Q4 | ✅ | `game/flow.ts` `endRound` | at most one player with markers |
| EG5–EG7, Q19–Q20 | ✅ | `game/flow.ts` `finalStandings` | points − stones; most stones; first to the score; else shared |
| P5.1–P5.3 | ✅ | `rules.ts` `actionPower` | +1 for Line Expansion only |

## Mechanical checks

- `npx tsc --noEmit -p .`: clean.
- `scripts/render-reads.mjs src`: 0 reads to review.
- No `Math.random`, `Date.now` or module-level game state; the module `let`s are geometry caches.
- Every pick is reached only with a non-empty legal set (each action tests its options first and logs when
  there is nothing to do).
- Piece creation: setup, the unlimited supplies (buildings, line markers), the dev-only scenes, and the LE16
  stand-in marker.
- Soak: `scripts/ai-soak.mjs`, 3–5 players, every game finishes; no stalls, rule errors or untagged picks.

## Deliberate choices (in `implementationNotes`)

- Scores are shown as sparks; the printed track is painted out (Q1).
- Line markers and buildings are unlimited (Q7, Q8: the original rules say so; Capstone's books are silent).
- The map's streets, crossings and building locations are drawn as raised chits over the board art.
