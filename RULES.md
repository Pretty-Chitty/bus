# Bus — rules specification

**Source:** *Bus*, Capstone Games / Splotter, English rulebook ("city centre timetable and route map",
© 2019), `rules.pdf` (2 pages, each a 4-panel spread). The PDF's text is outlined, so everything below was
read from the rendered pages (`pages/hi-*.png`, 300 dpi). The board (`art-src/tts/board.png`, from the Steam
Workshop mod "Bus — Complete Edition", id 3495807742) is the Capstone 20th-anniversary board and is the
source for every picture-only value in §B. BGG id 552.

**Second source (clarifications):** the publisher's rewrite of the same rules for the *Bus Complete Edition*
(Capstone, © 2024), `rules-2024-complete.pdf` (text in `rules-2024-complete.txt`), from
`capstone-games.com/cdn/shop/files/BUS-CompleteEdition-Rules-web.pdf`. It is the same game in plainer words,
but its board differs from ours (it prints negative numbers under the action spaces). The 2019 book is the
spec; quotes marked **[2024]** come from the rewrite, where it settles something the 2019 text leaves open.
A fan transcription of the original 1999 Splotter rules
(`gist.github.com/instinctive/ab8eda3218e331e91735086a3543672b`) is cited as **[1999 fan]**. It is
supporting evidence only: that edition differs (lettered building tiers, unlimited supplies).

Each id makes one assertion. Quotes are the book's words. Anything I had to infer, not read, is in **Open
questions** (§Q) and is **not** enforced until the developer rules on it.

---

## C — Components

| id | rule |
|---|---|
| C1 | 1 game board: a city map and an action area of seven actions. |
| C2 | Line markers, one colour per player: **unlimited** (Q7). The box has 25 per colour. |
| C3 | 100 action markers: "Each player … receives 20 action markers". |
| C4 | 25 bus tokens: "5 bus tokens" per player. |
| C5 | 15 passengers (shared supply). |
| C6 | 5 score disks, one per colour. |
| C7 | 5 time stones. |
| C8 | Building tiles in three kinds (houses, offices, pubs): **unlimited** per kind (Q8). The box has 90. |
| C9 | 1 start-bus (the starting-player marker). |
| C10 | Player colours, from the board's bus depot and line-expansion icon: purple, blue, green, yellow, red. |
| C11 | 3–5 players. The book names a 3-player rule (S4) and a 5-player rule (P5); there are no rules for 2 or 6. |

## B — Board data (picture-only; read off the board scan)

| id | rule |
|---|---|
| B1 | The city map is a graph of **crossings** joined by **streets**. Line markers go on streets; passengers and buildings belong to crossings. *(Exact crossing/street list: to be measured from the board into `src/geometry/` in Phase 5; not yet transcribed.)* |
| B2 | 47 **building locations** (the encircled numbers), each joined by a short leader line to exactly one crossing. Zones (the board's legend calls them "Phase 1–4"): **zone 1 = 12, zone 2 = 11, zone 3 = 9, zone 4 = 15**. *(Counted by eye and by a disc detector, which agree; see Q-B.)* |
| B3 | 2 crossings are **train stations** (the large blue bus/train discs: one north-east, one south-west). |
| B4 | 4 crossings are the **roundabouts directly adjacent to Central Park** (the ringed white discs at the park's four corners). |
| B5 | The victory-point track runs 0–20 down the left edge of the board. The port shows scores as sparks instead (Q1), and crops the printed track off the board art. |
| B6 | The clock has three positions, clockwise: **house → office → pub → house**. Read off the dial: house icon at 2 o'clock, office at 6, pub at 10. The book's example agrees: "Time goes on from night to day, so the citizens want to go to their offices." |
| B7 | The clock has 5 spaces for time stones. |
| B8 | Action area, top to bottom, with its spaces in printed order, left to right: **Line Expansion** F E D C B A · **Buses** (1 space) · **Passengers** A B C D E F · **Buildings** F E D C B A · **Clock** (1 space) · **Vrrooomm!** A B C D E F · **Starting Player** (1 space). |
| B9 | The bus depot is a 5 × 5 grid, one column per colour. |

## S — Setting up

| id | rule |
|---|---|
| S1 | "Each player chooses a color and receives 20 action markers, the line markers, 5 bus tokens, and scoring disk in that color." |
| S2 | "The scoring disk for each player is placed on the zero space of the victory point track." |
| S3 | "Place the five glass time stones on the spaces next to the clock." |
| S4 | "**3-player game:** Only use 4 time stones." |
| S5 | "The clock hand is placed so that it points to the house on the clock." |
| S6 | "Each player puts one of their buses in the bus depot in the action area." Every player starts with 1 bus. |
| S7 | "Put four passengers on the roundabouts directly adjacent to Central Park." (One on each of the four, B4; see Q14b.) |
| S8 | "Randomly determine a starting player and give that player the start-bus." |

## FB — The first buildings

| id | rule |
|---|---|
| FB1 | "The starting player first chooses two zone 1 locations … and puts a building on each of them, freely choosing which types of buildings to place." |
| FB2 | "The zone 2, 3, and 4 locations cannot be used until later in the game." |
| FB3 | "Proceeding clockwise from the starting player, each of the other players may erect two buildings. Only the zone 1 locations are available at this time." *("may" here; FB1 and the round's turn order imply each player does. See Q15.)* |
| FB4 | "**General rule for placing buildings:** No more than one building can be built on any of the locations." |

## FL — The first lines

| id | rule |
|---|---|
| FL1 | "Beginning with the starting player and proceeding clockwise, all players put down a line marker in their own color in one of the streets in the city." |
| FL2 | "Players are allowed to place a line marker in a street occupied by another player." (First marker only.) |
| FL3 | "The last player to place a line marker (i.e. the player to the right of the starting player) now expands their bus line by placing a second line marker at one of the ends of their first line marker." |
| FL4 | "Continuing in reverse player order, all other players place a second line marker. The starting player is therefore the last to place their second line marker." |
| FL5 | "The rules for expanding your bus line (see Line Expansion) must be followed when placing the second line marker. This means that placing the second line marker in an occupied street might not be allowed." |
| FL6 | "When all players have placed their two buildings and two line markers, the starting player begins the first round!" |

## R — The round

| id | rule |
|---|---|
| R1 | "A round consists of two phases. First, the players choose actions. Then, the actions are performed one by one." |

### CA — Choosing actions

| id | rule |
|---|---|
| CA1 | "Each player must choose a minimum of two actions each round." |
| CA2 | "The maximum number of actions you may choose is limited only by the number of action markers in your possession." |
| CA3 | "The starting player begins by placing one of their action markers on one of the seven actions. Then, the next player in clockwise order, places one action marker." |
| CA4 | "Play proceeds in this way until everyone has chosen at least two actions." |
| CA5 | "The actions Buses, Clock, and Starting Player can only be chosen by one player each round." (Each has one space, B8.) |
| CA6 | "The other actions may be chosen by multiple players. The first player to choose such an action puts their marker on the space marked A, the second puts their marker on the space marked B, etc." Spaces fill strictly in letter order. |
| CA7 | "Players may choose the same action more than once in the same round." |
| CA8 | "If a player has already placed two action markers when it becomes their turn to play, they may pass. This means they cannot place any more action markers that round." |
| CA9 | "Players keep choosing actions until all players have passed." |
| CA10 | "Players may use as many action markers as they want in a given round, subject to available action spaces." An action whose spaces are all taken cannot be chosen. |
| CA11 | "If a player has no more action markers, they are out of the game." (See Q2, Q3.) |

### RA — Resolve actions

| id | rule |
|---|---|
| RA1 | "The actions are resolved one by one, from top to bottom on the game board, beginning with the Line Expansion action and ending with the Starting Player action." (Order: B8.) |
| RA2 | Within an action: "The first player to perform an action is always the one whose action marker is furthest to the left." |
| RA3 | "For Line Expansion and Buildings, this will be the last player that has chosen the action." (Their spaces read F…A, so the highest letter in use resolves first and A resolves last.) |
| RA4 | "For Vrroomm! and Passengers, it is the first." (A resolves first.) |
| RA5 | "A player must perform all the actions they have chosen to their fullest extent." |
| RA6 | "If an action can only be partially performed, it must be completed to the maximum extent possible." |
| RA7 | "Players are not allowed to skip actions or parts of actions." (Except the Clock's optional stop, CL3.) |

### MB — The maximum number of buses

| id | rule |
|---|---|
| MB1 | "At the beginning of the game, each player only has one bus." |
| MB2 | "The largest number of buses owned by one player determines the maximum number of buses." |
| MB3 | The quantity for Line Expansion, Passengers and Buildings: space A performs the action "up to the maximum number of buses", space B "one number less, etc." (A = max, B = max − 1, C = max − 2, …; see Q5 for when this reaches 0.) |
| MB4 | "If the player who has the most buses buys another bus, the maximum number of buses immediately increases." The maximum is read when each action resolves. Buses resolves after Line Expansion and before Passengers and Buildings (B8), so a bus bought this round raises Passengers and Buildings this round. |
| MB5 | The book's own reading: "Note that … players who have chosen the Passengers or Buildings actions must bring more passengers or buildings into play that turn." *(The sentence breaks across a page as "Note that building / players who have chosen…"; it restates MB3 for those two actions.)* |

### LE — Line Expansion

| id | rule |
|---|---|
| LE1 | "The first player to choose the Line Expansion action (the player on space A) must add as many streets to their route as the current maximum number of buses. The player on space B must add one less, the player on space C must add two less, etc." |
| LE2 | "These actions are performed in reverse order: the player on space A will be the last to expand their line!" |
| LE3 | "To add a new street, place a line marker of your player color on that street." |
| LE4 | "A bus line can only be expanded from one of its two ends." |
| LE5 | "You must expand a line in a direction which is still empty of other bus lines." A street is *empty* if it holds no line marker of any colour. |
| LE6 | "You are not allowed to build a line that runs parallel to another player's bus line." There are two exceptions, LE7 and LE9. |
| LE7 | **Exception 1:** "If there are no empty streets at one of the ends, you can expand your bus line parallel to another player's line by placing your line directly adjacent to their line." |
| LE8 | "You may freely choose where to go in such a situation, even if this means that three or more lines will go through the same street." |
| LE8a | "On the next crossing, you must turn onto an empty street if it is present." (That is, LE5 applies again at the new end.) |
| LE9 | **Exception 2:** "If the end of your own line ends on the same crossing as another player's end, you may build a stretch of road parallel to the other player's line, even if there are still empty streets." (See Q9.) |
| LE10 | "If there are already two lines in the street, they should both have an end at the crossing in question." (Constraint on LE9.) |
| LE11 | "In any case, at the next crossing, you will again select an empty street, if it is available." |
| LE12 | "Players are also not allowed to build a line parallel to one of their own lines." You may never place a marker on a street that already holds your colour. Example: "Red cannot back up along their own line." |
| LE13 | Example, on LE9: "Red cannot build parallel to the yellow line, because the ends do not touch each other." (A line that merely passes through the crossing does not count.) |
| LE14 | Example, on LE9: "If Yellow builds a road there first, this opportunity is lost." (Exception 2 lasts only while the other player's end stays at that crossing.) |
| LE15 | "If a player builds a circle, the end of their line remains at the crossing where the circle was closed. This player can only build from this crossing, in two different directions, as there are two ends present." |
| LE16 | "When you close a circle, take the action marker from the action board and place it on the crossing to indicate the location of the ends." (A display rule: the digital port marks the ends instead. The marker still counts as used.) |
| LE17 | "The ends should always remain such that the complete route is a line. So, a bus must be able to travel from one end to the other by passing each street exactly once." |
| LE18 | Example (closing a circle): after closing at B, "Purple's following street must be one of the streets marked 2", i.e. leaving from the closing crossing. |
| LE19 | "Lines that have been put on the game board can never be removed." |
| LE20 | Each player owns exactly one line (one route). Buses run only on it. |
| LE21 | **[2024]** "Your bus line must always be a non-branching line of Bus Line markers; however, it can loop to cross itself." A line may run into a crossing it already passes through (a "partial-line loop"); its ends are then the trail's two ends. |
| LE22 | **[2024]** Exception 2 is "for 1 street": "If your bus line ends at the same intersection as another player's bus line, but coming from a different direction, you may continue your bus line alongside theirs for 1 street, rather than onto an unoccupied street." The street is the one that player's line ends along. |
| LE23 | **[2024]** Closing a full loop with a street that joins both ends: "Purple can choose whether the line was extended from A to B, or from B to A." The closing crossing, and so the new end, is whichever crossing the player says they extended *to*. |
| LE24 | **[2024]** Exception 1 is decided per end. In the book's example, "From C, all streets are occupied … so with no empty streets, either direction is permissible. From D, there is only one option, because there is one unoccupied street." |

### BU — Buses

| id | rule |
|---|---|
| BU1 | "The player who chose this action places a bus token in the bus depot in the action area." One bus per action. |
| BU2 | "Every bus token in the bus depot stands for one bus which may ride that player's line." |
| BU3 | "Each bus will transport a maximum of one passenger each turn." |
| BU4 | A player has at most 5 buses (C4). (See Q6 for choosing Buses with all 5.) |

### PA — Passengers

| id | rule |
|---|---|
| PA1 | "The first player to choose Passengers (the player on space A) must bring into play the same number of passengers as the maximum number of buses. The second player places one less passenger, etc." |
| PA2 | "The passengers must be placed at one of the two stations." |
| PA3 | "You may distribute the passengers over both stations." |
| PA4 | "The line of the player who chose the action does not have to be connected to the station." |
| PA5 | "The new passengers are taken from the supply and put on the station." |
| PA6 | "If there are no more passengers in the supply, no more passengers can be put into play. If a player still chooses this action, they do nothing." (The book lets a player choose an action that will do nothing.) |

### BD — Buildings

| id | rule |
|---|---|
| BD1 | "The first player to choose this action (the player on space A) must erect as many buildings as the maximum number of buses. The second player erects one less building, etc." |
| BD2 | "These players will have their turns in reverse order with the player on space A being the last one to erect buildings." |
| BD3 | "A building may be placed on any available building location (the encircled numbers) on the board." |
| BD4 | "You are free to choose which type of building you build." |
| BD5 | "At first, only the 1-locations may be built. Only when all the 1-locations have been built, the 2-locations can be used. If they are all full, the 3-locations become available. When they too have all been built, players may start using 4-locations." |
| BD6 | "If there are no more free locations the game ends at the end of the current round." (Also EG4.) |

### CL — The Clock

| id | rule |
|---|---|
| CL1 | "The Clock action can be chosen by only one player each round." |
| CL2 | "When it is time to resolve the action, this player may choose to stop time." |
| CL3 | "The player is not required to do so." |
| CL4 | "If the player stops time, the clock hand stays on the type of building which it was on." |
| CL5 | "If no one chooses this action, or if the player that selected the action does not stop time, the clock hand moves one space clockwise." (Timing: Q18.) |
| CL6 | "If a player stops time, they must take one time stone from the clock. They keep this stone, which counts as one negative point." |
| CL7 | "If you choose the Clock action and let time go its way, you do not take a time stone or receive a negative point." |
| CL8 | "If there are no more time stones on the clock, the space-time continuum ruptures, and the game ends immediately. Further actions in that round are not played. Points are counted immediately." |
| CL9 | **[2024]** After the Clock step, whether time moved or paused: "1. Move all passengers that are on Building discs to stand on/near the intersection there. 2. Each passenger standing at the same intersection as their destination (as indicated by the clock hand), steps right in if the building is empty … Only 1 passenger per building!" Passengers left over want to get away (VR9). |

### VR — Vrrooomm!

| id | rule |
|---|---|
| VR1 | "The Vrroomm! action is the only one that scores you points." |
| VR2 | "A player choosing Vrroomm! can run all of their buses possible." |
| VR3 | "Each bus can transport a maximum of one passenger." |
| VR4 | "The passenger is taken from the crossing where they are located and is put down at the crossing where they want to be." |
| VR5 | "Buses can ride only their own lines. Passengers or buildings which are on a crossing that is not connected to one of your lines cannot be used." Both the passenger's crossing and the destination crossing must lie on your line. |
| VR6 | "On each crossing, there can be passengers and buildings." |
| VR7 | "Depending on the time of day as indicated by the clock, passengers will want to be in certain kinds of buildings: their houses, their offices, or the pubs." |
| VR8 | "Each building can contain a maximum of one passenger." |
| VR9 | "Passengers that are on a crossing which does not have the type of building needed want to get away." (Surplus passengers: Q14.) |
| VR10 | "To indicate which passengers want to get away, put all satisfied passengers on their respective buildings." Example: passengers in the wrong buildings step back onto their crossing, and a passenger "crosses the street" to a right-type building at its own crossing. |
| VR11 | "Only passengers that want to get away can be transported." |
| VR12 | "One needs an empty building of the right kind to deliver the passenger. This building must be connected to your own line." |
| VR13 | "Each building can only contain one passenger!" |
| VR14 | "If there are no passengers that want to get away, a player cannot run their bus." |
| VR15 | "If there are more passengers or empty buildings than the player can use, they freely decide which passengers, or buildings, to use." |
| VR16 | "You must transport as many passengers as possible (keeping in mind the number of buses at your disposal)." |
| VR17 | "If a player chooses the Vrroomm! action more than once, they may use all their buses again every time they perform this action." |
| VR18 | "For each passenger that you move, you score one point." |
| VR19 | "These are counted on the victory point track on the game board. The first player to score a certain score places their disk on the corresponding space. If someone else scores as many points, their disk is placed on top of the existing disk." (Order of arrival is recorded for EG7.) |
| VR20 | Stations have no building locations (B2, B3), so passengers on a station always want to get away. |

### SP — Starting Player and the next round

| id | rule |
|---|---|
| SP1 | "Whomever chose this action will receive the start-bus next round." |
| SP2 | "If no one chose this action, the start-bus goes to the player to the left of the previous starting player." (Left = next clockwise.) |
| SP3 | "When all actions have been performed, the next round starts." |
| SP4 | "All the action markers which have been used are put back in the box. They will no longer be used in this game." |
| SP5 | "The player who has the start-bus begins the next round by choosing their first action." |

## EG — End of the game

| id | rule |
|---|---|
| EG1 | "The game ends in one of three ways:" |
| EG2 | "The game ends immediately when the last stone is taken from the clock." (CL8) |
| EG3 | "The game ends at the end of a round if, at that moment, only one player has any action markers left to play." (Q4) |
| EG4 | "The game ends at the end of a round if there are no more free building locations." |
| EG5 | "Whomever has scored the most points wins the game! Each time stone counts as one negative point." |
| EG6 | "If two or more players have the same number of points after subtracting these negative points, the one who has the most time stones wins." |
| EG7 | "If this is still equal, the one whose disk is at the bottom of the stack (the player that achieved those points first) on the victory point track wins." |

## P5 — Playing with 5 players

| id | rule |
|---|---|
| P5.1 | "When playing with five, more line markers are used for the Line Expansion action. Every player resolving this action must add one additional line marker." |
| P5.2 | "The first player to choose Line Expansion (the player on space A) must add as many streets to their route as the current maximum number of buses plus one. The player on space B must add exactly as many as the current maximum number of buses, the player on space C adds one less than the current maximum number of buses, etc." |
| P5.3 | "This rule is only applicable to the Line Expansion action." |

---

## Q — Open questions

Researched on the web (2026-11-03): the 2024 Capstone rewrite, the 1999 fan transcription, the BGG wiki and
retailer and review pages. **Resolved** means a source answers it, and the rule now stands as written.
**Open** means no source does; the default is used, and where the question is whether something is allowed,
the default allows it.

### Resolved by a source

| id | question | answer | source |
|---|---|---|---|
| Q2 | A player with exactly 1 action marker left can't meet CA1's "minimum of two". | They place it, then must pass. | [1999 fan]: "If a player has no more action markers, that player must pass. If a player has not yet placed two action markers this turn, that player must place an action marker." |
| Q3 | Does an "out of the game" player (CA11) still score and win normally? | Yes: they only stop taking actions. | [2024]: "when you have no more Action markers, you will take no more actions for the rest of the game!" |
| Q5 | When MB3/LE1 reach 0 or below, the player does nothing? | Yes; the marker is still spent. | [2024]: "If your action power is less than or equal to 0, you won't perform the action at all", with a worked example (Purple on D: "3 − 3 = 0"). |
| Q9 | Exception 2: which street? | The street the other player's line ends along, at the crossing where both ends meet, "for 1 street" (LE22). LE10 still applies: every line already in that street must end at this crossing. | [2024] exception text and the Blue example; 2019 LE10. |
| Q10 | Is exception 1 decided per end? | Yes (LE24). Legal streets are the union over both ends of: empty streets; at an end with no empty street, any street (LE7); exception-2 streets (LE22). Never a street holding your own colour (LE12). | [2024] Red example. |
| Q11 | May a line run into a crossing it already passes through (a "lasso")? | Yes (LE21). | [2024]: "it can loop to cross itself", plus the "partial-line loop" example. |
| Q12 | A dead end simply can't be extended? | Yes; RA6. | 2019 RA6; [2024] "resolve it as fully as possible". |
| Q13 | First marker anywhere; the second follows LE, including exception 2? | Yes. | [2024] First Bus Lines: "on any street — even if another Bus Line marker is already on it", then the same exception footnote. |
| Q14 | One office, two passengers at office time: does the second want to get away? | Yes. Satisfied = min(passengers, right-type buildings at that crossing). | [2024] CL9: "steps right in if the building is empty … Only 1 passenger per building!" |
| Q14b | Setup: one passenger per roundabout? | Yes. | [2024]: "1 passenger on each roundabout." |
| Q15 | Are the first two buildings optional ("may erect")? | No: every player places exactly two. | [2024]: "each player chooses 2 unoccupied, lowest-number construction sites … and places a building on each". |
| Q17 | Vrrooomm! must move the maximum possible number of passengers. | Yes; the player chooses which. | [2024]: "you must try to use each of your buses to transport 1 passenger"; 2019 VR16. |
| Q18 | When nobody chose the Clock, the hand moves at the Clock step, and passengers reseat there. | Yes. | [1999 fan] Clock section: "If no one chose The Clock, move the time stone on the clock clockwise one icon", then the reseat; [2024] CL9 reseats "either way". |
| Q19 | Does the tie really go to the player with *more* time stones? | Yes, it isn't a misprint. | [2024]: "If tied, the tied player with the most Time stones wins"; [1999 fan] says the same. |
| Q1 | Scores past 20 on the 0–20 track. | The developer: scores are shown as sparks, not on the printed track, so there is no cap. Arrival order is still recorded for EG7. | Developer, 2026-11-03. |
| Q7 | Is each player's supply of line markers limited to 25? | **Unlimited.** | Developer: "if the rulebook says it is unlimited, then do it"; [1999 fan]: "The supply of bus line sticks is unlimited." |
| Q8 | Building tiles: can a kind run out? | **Unlimited** per kind. | Developer, as Q7; [1999 fan]: "The supply of buildings is unlimited." |

### Still open (default in force)

| id | question | default | notes |
|---|---|---|---|
| Q4 | If *no* player has markers left, does EG3 end the game? | Yes: it ends at round end when ≤ 1 player has markers. | Trivial, but no source says it. |
| Q3b | A player who is out holds the start-bus. | It passes left to the next player who still has markers. | — |
| Q6 | May a player choose Buses when they already own 5? | Allowed; it does nothing (it still blocks Buses for everyone else). | PA6 lets you choose an empty Passengers action. [2024]: "add 1 of your buses to 1 of your empty spaces", and there are none. |
| Q20 | Players tied at 0 with no stack order. | A shared win. | — |
| Q-B | Zone counts 12 / 11 / 9 / 15 = 47. | — | Please check against your board. |
