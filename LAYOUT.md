# Bus — table layout

## Panels

| Panel | Chit | Holds | Tab | Min size |
|---|---|---|---|---|
| Board | `MainBoard` | the board art (terrain + the printed action area), the road network (streets and crossings, sharing one outline), building locations, action spaces, clock hand, time stones, bus depot. No supply mat: buildings and line markers are unlimited, and the passengers still to come are the board panel's spark | the train-station disc, on the cover's teal | 380 × 270 |
| Each player | `Player` | unspent action markers (5 × 4 block), unbought buses, time stones taken, the start-bus standee | the engine's player tab | 110 × 70 |

Sparks (player bar): points (bound to the player: the match score) and action markers left. Board panel: the passengers still to come (C5). The 0–20 score track
is painted out of the board art (developer, Q1).

## Split tree

Space is shared in proportion to the minimum sizes, which also set when things fold (engine `LayoutHelper`).

Desktop (1440 × 900):

```
+--------------------------------------------+-----------+
|                                            | my tray   |
|                    board                   |           |
|                                            +-----------+
|                                            | opponents |
|                                            |  (tabs)   |
+--------------------------------------------+-----------+
root: optimizePreferHorizontal (collapse 5)
  board (order 1, 380×270)
  side: optimizePreferVertical (collapse 4): my tray (order 100) | opponents as one tab group
```

Phone (400 × 800): the horizontal split does not fit (490 > 400), so the root stacks vertically:

```
+------------------+
|      board       |   pinch to zoom (camera maxZoom 6)
+------------------+
| trays (one tab   |   yours first: each tray gets the whole lower half
|  group)          |
+------------------+
```

## Positions

- Every printed spot is measured on the scan by `scripts/geometry/build_board.py` into `src/geometry/board.ts`
  (crossings, streets, locations with zones and crossings, action spaces, stone spaces, depot slots, clock pivot
  and sector angles), 100 scan px = 1 world unit.
- Line markers lie along their street, side by side by index when several lines share it.
- Passengers stand on their crossing, spread round it by index; a satisfied passenger stands on its building.
- Spent action markers marking a looped line's ends (LE16) stand on the board beside the crossing.

## What each prompt focuses

Every pick focuses the board: the action spaces (choose an action), the streets (line expansion), the stations
(passengers), the locations (buildings), the clock (stop time), the lines (Vrrooomm!).

## Choices

- Actions are chosen on the board, by clicking the next free space; no inline gallery, because which letter you
  get matters (developer).
- New pieces are clicked into place, not dragged (developer: "this is pretty plain Jane"). A building is two picks:
  the kind in the inline strip (house, office, pub; `BuildingMenu`), then a free location, with the chosen kind as
  the prompt's context chit. A line marker: click the street. A new passenger: click the station.
- Vrrooomm! is still a drag, passenger onto building, both on the board.
