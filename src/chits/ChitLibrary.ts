import { IChitLibrary } from "@pretty-chitty/core";

import { ActionLabel } from "./ActionLabel";
import { ActionMarker } from "./ActionMarker";
import { ActionSpace } from "./ActionSpace";
import { Building } from "./Building";
import { BuildingOption } from "./BuildingMenu";
import { BuildingMenu } from "./BuildingMenu";
import { BusToken } from "./BusToken";
import { ClockHand } from "./ClockHand";
import { Crossing } from "./Crossing";
import { Cursor } from "./Cursor";
import { DepotSlot } from "./DepotSlot";
import { LineMarker } from "./LineMarker";
import { Location } from "./Location";
import { MainBoard } from "./MainBoard";
import { Passenger } from "./Passenger";
import { Player } from "./Player";
import { PlayerAid } from "./PlayerAid";
import { RoadNetwork } from "./RoadNetwork";
import { Root } from "./Root";
import { ScoreSpark } from "./Sparks";
import { MarkersSpark } from "./Sparks";
import { BusesSpark } from "./Sparks";
import { PassengerSpark } from "./Sparks";
import { StartBus } from "./StartBus";
import { StoneSpace } from "./StoneSpace";
import { Street } from "./Street";
import { TimeStone } from "./TimeStone";

export const ChitLibrary: IChitLibrary<Player, Root> = {
  ActionLabel,
  ActionMarker,
  ActionSpace,
  Building,
  BuildingOption,
  BuildingMenu,
  BusToken,
  ClockHand,
  Crossing,
  Cursor,
  DepotSlot,
  LineMarker,
  Location,
  MainBoard,
  Passenger,
  Player,
  PlayerAid,
  RoadNetwork,
  Root,
  ScoreSpark,
  MarkersSpark,
  BusesSpark,
  PassengerSpark,
  StartBus,
  StoneSpace,
  Street,
  TimeStone,
};
