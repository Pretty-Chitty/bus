import { loadEngine, silence, playMatch } from "../scripts/lib/harness.mjs";
silence();
const E = await loadEngine();
const out = (...a) => process.stdout.write(a.join(" ") + "\n");
for (const seed of [1, 2, 3]) {
  // play part of a game, then reload its saved state into a fresh match (what Back does)
  let saved;
  const first = await playMatch(E, { n: 3, seed, timeoutSec: 60, onMatch: (m) => {
    let k = 0;
    m.onChange(() => { if (++k === 150) saved = JSON.parse(JSON.stringify(m.state)); });
  } });
  if (!saved) { out("seed", seed, "never reached 150 changes", first.ok); continue; }
  let err;
  const second = await playMatch(E, { n: 3, seed, state: saved, timeoutSec: 60, onMatch: (m) => {
    const t = setInterval(() => { if (m.errorState.value) { err = m.errorState.value; clearInterval(t); } }, 5);
  } });
  out("seed", seed, "first", first.ok, "replayed", second.ok, second.why ?? "", err ? "ERROR: " + err : "");
}
process.exit(0);
