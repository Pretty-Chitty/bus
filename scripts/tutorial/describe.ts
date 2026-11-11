// A text picture of the table for the tutorial harness: what a narrator needs to know, and what a replay
// comparison fingerprints.
import type { Root } from "../../src/chits/Root";
import type { Player } from "../../src/chits/Player";
import { busesOf, clockKind, maxBuses, openZone } from "../../src/rules";

export function describePlayer(root: Root, p: Player): string {
  const start = p.startBus ? " START" : "";
  return `${p.name} (${["purple", "blue", "green", "yellow", "red"][p.colorIndex]}${start}): ${p.score} pts, ${p.stones.length} stones, ${busesOf(root, p)} buses, ${p.markers.length} markers; line ${p.route.join("-") || "-"}`;
}

export function describeTable(root: Root, me: Player): string {
  const b = root.mainBoard;
  const lines: string[] = [];
  lines.push(`round ${root.round}${root.endReason ? " END " + root.endReason : ""}; clock ${clockKind(root)}; stones ${b.stoneSpaces.filter((s) => !!s.stone).length}; max buses ${maxBuses(root)}; zone ${openZone(root)}; supply ${b.supply}`);
  for (const p of root.players.copy()) lines.push((p === me ? "* " : "  ") + describePlayer(root, p));
  const taken = b.actionSpaces.filter((s) => !!s.marker).map((s) => `${s.action}:${s.letter}=${["pu", "bl", "gr", "ye", "re"][s.marker!.colorIndex]}`);
  lines.push(`  actions: ${taken.join(" ") || "-"}`);
  const people = b.roads.crossings.filter((c) => c.passengers.length > 0).map((c) => `${c.crossingId}x${c.passengers.length}`);
  const seated = b.locations.filter((l) => l.building?.passenger).map((l) => `${l.crossingId}`);
  lines.push(`  waiting: ${people.join(" ") || "-"}; seated at: ${seated.join(" ") || "-"}`);
  const built = b.locations.filter((l) => l.building).map((l) => `${l.locationId}@${l.crossingId}=${l.building!.kind[0]}`);
  lines.push(`  buildings: ${built.join(" ") || "-"}`);
  return lines.join("\n");
}
