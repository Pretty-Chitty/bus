// What makes a good run of each stage of the tutorial, for `search` (scripts/tutorial/cli.ts).
import type { RunResult } from "./harness";
import type { Pins } from "../../src/tutorial/script";

export let rejectReason = "";
export const reject = (why: string) => {
  rejectReason = why;
  return -Infinity;
};

export type Objective = {
  describe: string;
  prepare?: (pins: Pins, random: () => number) => Pins;
  score: (r: RunResult) => number;
};

export const objectives: { [name: string]: Objective } = {
  /** Any completed run. */
  any: {
    describe: "the run completes",
    score: (r) => (r.outcome === "completed" ? 1 : reject(String(r.outcome))),
  },
};
