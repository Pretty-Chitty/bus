// ---------------------------------------------------------------------------------- selectors ---
const board = (root: Root) => root.mainBoard;
const loc = (id: string) => (root: Root) => root.mainBoard.location(id);
const building = (id: string) => (root: Root) => root.mainBoard.location(id).building;
const street = (id: string) => (root: Root) => root.mainBoard.street(id);
const crossing = (id: string) => (root: Root) => root.mainBoard.crossing(id);
const stackTop = (kind: "house" | "office" | "pub") => (root: Root) => root.mainBoard.staging[`${kind}s` as "houses"].top;
const nextLine = (root: Root) => root.mainBoard.staging.lineSpot;
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
const lineOf = (who: (root: Root, me: Player) => Player) => (root: Root, me: Player) =>
  root.mainBoard.roads.streets.filter((s) => s.markers.some((m) => m.colorIndex === who(root, me).colorIndex));
const myLine = lineOf((_r, me) => me);
const milaLine = lineOf((r) => mila(r));
const bramLine = lineOf((r) => bram(r));
const clockHand = (root: Root) => root.mainBoard.clockHand;
const stones = (root: Root) => root.mainBoard.stoneSpaces.map((s) => s.stone).filter(Boolean) as Chit[];
const supply = (root: Root) => root.mainBoard.staging.supply.copy();
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
const spaceTaken = (action: string, letter = "A") => state((root) => !!root.mainBoard.spacesOf(action as any).find((s) => s.letter === letter)?.marker);
