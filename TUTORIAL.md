# Bus — the tutorial

**The lesson.** Three players (you, Mila and Bram), four time stones; you start. The narrator is the City
Transit Authority (the rulebook's cover is its "city centre timetable and route map"), speaking to your bus
company. The lesson plays the opening (two buildings and two streets each) and two full rounds:

- **Round 1:** you take Vrrooomm! A and Buses, then pass. Your bus raises the most-buses count before
  Passengers and Buildings. Nobody takes the Clock, so it moves on to the office. The passenger on your
  roundabout wants to get away, and your bus carries them to your office: your first point. With one passenger
  and one office, the engine answers both picks itself, so the player watches this carry.
- **Round 2:** you plan for the pub. You take Buildings A (two pubs on your roundabout), Passengers A (two to your
  station) and Vrrooomm!. Bram takes the Clock and lets time run. Three passengers wait on your line and you
  have two buses: **the player chooses** which two to carry and which pub each goes to (tap a passenger, which
  lifts, then a pub; tapping another passenger first switches). Every choice scores the same two points, and the
  rest of the lesson plays the same whichever is made (checked with three other paths forced). Nobody takes
  Starting Player, so the start-bus passes to you.
- **The close:** the parallel-line exceptions, loops and their end markers, zones, the three ways the game ends,
  scoring and ties, and the player aid. Then `end: "continue"`: round 3 is yours to play.

Every draw and bot move is pinned (`src/tutorial/pins.json`). The bots are steered (`steer` in the script) to
keep the lesson intact: in round 1 nobody else takes Buses or the Clock or builds at your roundabout; in round 2
nobody takes your A spaces, Bram takes the Clock and lets it run, and nobody's line reaches your roundabout.

The narration is Kokoro's bm_daniel on a local Voicebox server (the developer's pick by ear), force-aligned by
`scripts/tutorial/align.py`. For the voice only, "Vrrooomm" is respelt "Vroom" (`pronounce`), space letters are
spoken "eigh", "bee", "eff", quote marks are dropped, and silence is spliced in at colons and sentence ends
(`narrator.pauses`). Action-space names are quoted in the text (“Buses”) to tell them from the pieces.

## Coverage

| Rule | How | Where |
|---|---|---|
| C1 | shown | welcome, map |
| C2 | shown | fl-intro, fl-first |
| C3 | shown | tray |
| C4 | shown | tray, others-r1-bus |
| C5 | shown | passengers |
| C6 | explained | goal (the points spark) |
| C7 | shown | others-r2-clock |
| C8 | shown | fb-intro |
| C9 | shown | tray, others-r1-start |
| C10 | skip | the colours are assigned |
| C11 | skip | the tutorial is a three-player game; the counts are in the lobby |
| B1 | shown | map |
| B2 | shown | locations |
| B3 | shown | passengers, fl-second |
| B4 | shown | passengers |
| B5 | explained | goal |
| B6 | shown | clock, others-r1-clock, others-r2-clock |
| B7 | shown | others-r2-clock |
| B8 | shown | r1-round, r1-actions |
| B9 | shown | tray, others-r1-bus |
| S1–S8 | skip | setup is done for you (the tray, clock and passengers steps show the result) |
| FB1–FB4 | shown | fb-intro, fb-office-kind, fb-office, fb-house-kind, fb-house, others-fb-mila, others-fb-bram |
| FL1–FL6 | shown | fl-intro, fl-first, fl-reverse, fl-second |
| R1 | shown | r1-round |
| CA1–CA4 | shown | r1-choose, r1-vroom, r1-buses |
| CA5–CA6 | shown | r1-choose |
| CA7 | shown | r2-vroom (Vrrooomm! again in a later round) |
| CA8–CA9 | shown | r1-pass, others-r1-done |
| CA10 | explained | r1-choose |
| CA11 | explained | tray, close-end |
| RA1 | shown | others-r1-done, others-r2-done |
| RA2–RA4 | shown | others-r2-line-mila, others-r2-bram-build, r2-passengers |
| RA5–RA7 | shown | every action resolves in full (r2-pub1, r2-carry2) |
| MB1–MB2 | shown | tray, others-r1-bus |
| MB3 | shown | others-r1-line, others-r2-line-mila |
| MB4 | shown | others-r1-bus, others-r1-passengers |
| MB5 | shown | others-r1-passengers, r2-pub1 |
| LE1–LE3 | shown | others-r1-line, others-r2-line-mila, others-r2-line-bram |
| LE4–LE6 | explained | fl-reverse, others-r2-line-bram, close-lines |
| LE7–LE14 | explained | close-lines |
| LE15–LE18 | explained | close-loops |
| LE19–LE20 | explained | map |
| LE21–LE24 | explained | close-lines, close-loops |
| BU1–BU3 | shown | others-r1-bus, r2-carry2 |
| BU4 | skip | the depot's five slots show it; it never matters in a first game |
| PA1–PA5 | shown | others-r1-passengers, r2-pax1, r2-pax2 |
| PA6 | skip | the supply never runs out in these two rounds |
| BD1–BD5 | shown | others-r1-buildings, others-r2-bram-build, r2-pub1, r2-pub2 |
| BD6 | explained | close-zones |
| CL1–CL7 | explained | others-r1-clock, others-r2-clock |
| CL8 | explained | others-r2-clock, close-end |
| CL9 | shown | others-r1-reseat, others-r2-reseat |
| VR1–VR5 | shown | r1-vroom, r1-carry, r2-carry1 |
| VR6–VR11 | shown | others-r1-reseat, others-r2-reseat |
| VR12–VR16 | shown | r2-carry1, r2-carry1-to, r2-carry2, r2-carry2-to (the player chooses which passengers and pubs: VR15) |
| VR17 | explained | r2-vroom |
| VR18–VR19 | shown | r1-carry |
| VR20 | shown | others-r2-reseat |
| SP1–SP2 | shown | others-r1-start, others-r2-start |
| SP3–SP5 | shown | r1-end, finish |
| EG1–EG4 | explained | close-end |
| EG5–EG7 | explained | close-score |
| P5.1–P5.3 | skip | a five-player rule |
| Q1 | explained | goal |
| Q2–Q4 | explained | close-end |
| Q5 | shown | others-r2-line-mila (one fewer per letter) |
| Q6–Q8 | skip | rulings on supplies that never run out in a first game |
| Q9–Q11 | explained | close-lines, close-loops |
| Q12–Q13 | explained | close-lines |
| Q14 | shown | others-r1-reseat |
| Q15 | shown | fb-office, fb-house |
| Q17 | shown | r2-carry1, r2-carry2 |
| Q18 | shown | others-r1-clock |
| Q19–Q20 | explained | close-score |

## Pieces

| Piece | Step that rings it |
|---|---|
| Board / city | welcome, map |
| Streets, crossings | map |
| Building locations, zones, leaders | locations, close-zones |
| Train stations, roundabouts | passengers, fl-second |
| Clock hand | clock, others-r1-clock, others-r2-clock |
| Time stones | others-r2-clock, close-end |
| Action spaces (all seven rows) | r1-actions |
| Action markers | tray, r1-choose |
| Bus tokens, depot | tray, others-r1-bus, others-r2-bus |
| Start-bus | tray, others-r1-start, others-r2-start |
| Building kinds (inline strip), passenger supply (board spark) | fb-office-kind, fb-house-kind, r2-pub1-kind, passengers |
| Buildings | fb-office-kind, fb-office, fb-house, r2-pub1-kind, r2-pub1 |
| Passengers | passengers, others-r1-reseat, r1-carry |
| Line markers | fl-first, others-fl-* |
| Points spark | goal, close-score |
| Player aid | close-aid |
