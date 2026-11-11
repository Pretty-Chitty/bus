import { SparkChit } from "@pretty-chitty/core";
import { MarkerIcon } from "../canvas/MarkerIcon";
import { PassengerIcon } from "../canvas/PassengerIcon";
import { BusIcon } from "../canvas/BusIcon";

/** The player's victory points (VR18–VR19); the score track is shown as this spark (Q1). */
export class ScoreSpark extends SparkChit {
  override get endGameLabel() {
    return "Points";
  }
}

/** Action markers left (CA11, EG3): a game-end clock, and private to nobody. */
export class MarkersSpark extends SparkChit {
  colorHex = "#888888";
  override get endGameLabel() {
    return "Markers";
  }
  override get icon() {
    return new MarkerIcon().set((m) => (m.hex = this.colorHex)).get();
  }
}

/** Buses in the depot (MB1–MB2, BU2): how many passengers a Vrrooomm! can carry, and what sets the action spaces'
 *  strength when it is the most. */
export class BusesSpark extends SparkChit {
  colorHex = "#888888";
  override get endGameLabel() {
    return "Buses";
  }
  override get icon() {
    return new BusIcon().set((b) => (b.hex = this.colorHex)).get();
  }
}

/** Passengers not yet in the city (C5, PA5–PA6): the supply, shown on the board's panel. */
export class PassengerSpark extends SparkChit {
  colorHex = "#e46920";
  override get endGameLabel() {
    return "Passengers";
  }
  override get icon() {
    return new PassengerIcon().get();
  }
}
