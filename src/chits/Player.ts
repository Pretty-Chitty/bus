import { PlayerChit, SparkChit, ChildOutlet, Ordered, OrderedOutlet, ChitRenderSpec } from "@pretty-chitty/core";
import { Vector3 } from "three";
import { PLAYER_COLORS } from "../consts";
import { hitBox, panelCamera, setupTable } from "../render";
import { ScoreSpark, MarkersSpark, BusesSpark } from "./Sparks";
import { ActionMarker } from "./ActionMarker";
import { BusToken } from "./BusToken";
import { TimeStone } from "./TimeStone";
import { StartBus } from "./StartBus";

/** Tray tints: each colour well down in saturation and brightness (quality-bar §6). */
const TRAY_TINT = ["#5a4a58", "#3e5470", "#3c5e54", "#6e6040", "#6e4840"];

/** A player and the pieces in front of them: unspent action markers, unbought buses, time stones taken,
 *  and the start-bus when they hold it. */
export class Player extends PlayerChit {
  colorIndex = 0;
  /** VR18: points scored (time stones subtract at the end, EG5). */
  score = 0;
  /** EG7: when the score was reached (smaller = disk lower in the stack). */
  scoreStamp = 0;
  /** The bus line as a trail of crossings, end to end (LE4, LE15–LE17). Empty before the first marker. */
  route: string[] = [];
  /** CA: markers placed this round, and whether the player has passed. */
  placedThisRound = 0;
  passed = false;
  /** Buses in the depot (busesOf), kept here for the spark. */
  busCount = 1;
  /** Bumped on every answer, so each answer changes state. */
  answers = 0;

  @Ordered(new Vector3(-1.45, 0.05, 0)) markers = new OrderedOutlet<ActionMarker>();
  @Ordered(new Vector3(0.75, 0.05, 0)) buses = new OrderedOutlet<BusToken>();
  @Ordered(new Vector3(0.6, -1.25, 0)) stones = new OrderedOutlet<TimeStone>();
  @ChildOutlet(new Vector3(2.35, 0.2, 0)) startBus?: StartBus;

  @ChildOutlet scoreSpark = new ScoreSpark().set((s) => s.bindToPlayer(this));
  @ChildOutlet markersSpark = new MarkersSpark();
  @ChildOutlet busesSpark = new BusesSpark();

  get hex() {
    return PLAYER_COLORS[this.colorIndex].hex;
  }

  override getSparks(): SparkChit[] {
    return [this.scoreSpark, this.busesSpark, this.markersSpark];
  }

  /** Keep the sparks' own fields current (they render from themselves). Call after any change. */
  syncSparks() {
    if (this.scoreSpark.value !== this.score) this.scoreSpark.value = this.score;
    if (this.markersSpark.value !== this.markers.length) this.markersSpark.value = this.markers.length;
    if (this.busesSpark.value !== this.busCount) this.busesSpark.value = this.busCount;
    for (const sp of [this.markersSpark, this.busesSpark])
      if (sp.colorHex !== this.hex) {
        sp.colorHex = this.hex;
        sp.color = this.hex;
      }
  }

  render(spec: ChitRenderSpec): void {
    // a fixed tray area, so the panel's framing does not jump as pieces come and go
    spec.object = hitBox(6.6, 3.3, 0.01);
    spec.childrenOffsetZ = 0;
    setupTable(spec, TRAY_TINT[this.colorIndex]);
    panelCamera(spec, 4, 22);
    spec.worthSlidingToPanelToShowChange = false;
  }
}
