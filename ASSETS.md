# Bus — assets

Everything the game ships is cut by two scripts from the sources below, so a bad crop is a script edit:

```
python3 -P scripts/geometry/build_board.py   # measures the board into src/geometry/board.ts (+ check images)
python3 -P scripts/art/build_board_art.py    # cuts src/assets/{board,icons,buildings} and src/geometry/shapes.ts
```

Shipped total (`src/assets/output/`): **≈ 927 KB**.

## Sources

| Source | What it gave | Where |
|---|---|---|
| Rulebook PDF (Capstone 2019) | the rules; the component photo (piece shapes and colours) | `rules.pdf`, `pages/` |
| Rulebook rewrite (Capstone 2024, *Complete Edition*) | rule clarifications only | `rules-2024-complete.pdf` |
| Steam Workshop "Bus — Complete Edition" (id 3495807742), the TTS save; assets from `images.steamusercontent.com` | the 2019 board scan (3894 × 2753), the building-tile icons, OBJ meshes (not shipped) | `art-src/tts/` |
| BoardGameGeek (id 552), the 2019 "Anniversary Edition" version image | box art; the start-bus standee's picture | `art-src/bgg-cover-2019.jpg` |

## Shipped

| Asset | Kind | From | Size |
|---|---|---|---|
| `board/board.jpg` | the board, terrain only: roads, crossings, locations, leaders and the score track painted out (the map is drawn as chits); the action area as printed, the depot's insets lightened 30% so the buses stand out | board scan, 70% | 2725 × 1927, 905 KB |
| `icons/lineExpansion, passengers, buildings, vroom` | each action's printed picture, paper made transparent | board scan's action column | 192 px palette PNG |
| `icons/clock` | the clock dial | board scan | 256 px |
| `icons/buses` | the depot (stands for the Buses action) | board scan | 300 px JPG |
| `icons/station` | the station's blue disc and train | board scan | 192 px |
| `icons/standee` | the start-bus standee's picture | 2019 box cover | 376 × 241 JPG |
| `buildings/house, office, pub` | building disc faces: the mod's icons, a third bigger, on one hue per kind (cream, teal, brick; not the print's three blue-greys, which could not be told apart at phone size) | TTS mod | 256 px JPG |
| `geometry/shapes.ts` | the passenger figure's outline, traced from the board's passenger icon | board scan | 43 points |
| `static/boxArt.jpg` | the 2019 cover | BoardGameGeek | 600 px, 78 KB |
| `static/screenshot.jpg` | the port, demo at the opening building placement | `scripts/screenshot.mjs` | 1800 × 1050, 270 KB |

## Drawn in code (no images)

- Streets (white raised strips with their printed names in Poppins Bold), crossings (plain, roundabout, station),
  building locations (navy discs, zone numerals in the sampled zone colours, leader lines): `src/canvas/*`,
  `src/chits/{Street,Crossing,Location}.ts`. They share one dark outline (the road network's outline group).
- Wooden pieces from the rulebook's component photo, colours sampled from it: line markers (square sticks),
  action markers (cylinders), bus tokens (rounded blocks), passengers (the traced figure), glass time stones.
- The clock hand (a dark cardboard pointer).

## Still to do

- The table is a CC0 walnut veneer (Poly Haven, Jenelle van Heerden), `scripts/art/build_table.py`.
