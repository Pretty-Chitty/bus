import {
  Game,
  GameResult,
  Turn,
  GameTheme,
  ChitRenderSpec,
  LightSpec,
  GameMetaData,
} from "@pretty-chitty/core";
import "@fontsource/quicksand/400.css";
import "@fontsource/quicksand/700.css";
import "./canvas/fonts";

import * as ButtonLibrary from "./ButtonLibrary";
import { ChitLibrary } from "./chits/ChitLibrary";
import { CanvasLibrary } from "./canvas/CanvasLibrary";

import { Root } from "./chits/Root";
import { Player } from "./chits/Player";
import { passengers, standee } from "./assets/icons";
import { house, office, pub } from "./assets/buildings";
import { CLICK_COLOR, THEME } from "./consts";
import {
  chooseActions,
  endRound,
  finalStandings,
  firstBuildings,
  firstLines,
  resolveActions,
  setupGame,
} from "./game/flow";
import { ai, DEFAULT_WEIGHTS, WEIGHT_RANGES } from "./ai";
import { tutorials } from "./tutorial/script";

import boxArt from "../static/boxArt.jpg";
import screenshot from "../static/screenshot.jpg";

const theme = GameTheme.withDefaults(THEME.ground, THEME.accent);
theme.fontFamily = "Poppins, Quicksand, sans-serif";
theme.actionBarColor = THEME.actionBar;
theme.chitHighlightColor = CLICK_COLOR;
theme.chitOutlineWidth *= 2 / 3;

export default class Bus implements Game<Player, Root> {
  metadata = {
    name: "Bus",
    licenseInformation:
      "Bus © Splotter Spellen / Capstone Games. Board art from the Capstone 20th-anniversary edition.",
    implementationNotes:
      "Fully implemented, for 3 to 5 players.",
    publisher: "Splotter Spellen, Capstone Games",
    designer: "Jeroen Doumen, Joris Wiersinga",
    artist: "Daan van Paridon, Thijs van Paridon",
    tutorialVideoUrl: "",
    rulesPdfUrl:
      "https://capstone-games.com/cdn/shop/files/BUS-CompleteEdition-Rules-web.pdf",
    purchaseUrl: "https://capstone-games.com",
    publisherUrl: "https://www.splotter.nl",
    repositoryUrl: "https://github.com/Pretty-Chitty/bus",
    description:
      "Run a bus line through a fast-growing city. Choose actions with a dwindling supply of markers: extend your route, buy buses, bring in passengers, put up houses, offices and pubs, stop the clock — and drive people where they want to be at this time of day.",
    boxArt,
    screenshot,
  } as GameMetaData;

  chitLibrary = ChitLibrary;
  canvasLibrary = CanvasLibrary;
  buttonLibrary = ButtonLibrary;
  theme = theme;
  ai = ai;
  tutorials = tutorials;
  /** For scripts/tune: the bot's weights and their ranges. */
  botTuning = { defaults: DEFAULT_WEIGHTS, ranges: WEIGHT_RANGES };

  tokenMap = {
    passenger: { image: passengers, text: "passengers" },
    house: { image: house, text: "house" },
    office: { image: office, text: "office" },
    pub: { image: pub, text: "pub" },
    startbus: { image: standee, text: "start-bus" },
  };

  async run(setup: Turn<GameResult<Player>, Player, Root>, root: Root) {
    await setupGame(setup, root); // S1–S8, all on the setup turn before the first flush
    await firstBuildings(setup, root); // FB1–FB4
    await firstLines(setup, root); // FL1–FL6
    for (;;) {
      await chooseActions(setup, root); // CA1–CA11
      await resolveActions(setup, root); // RA, LE, BU, PA, BD, CL, VR, SP
      if (endRound(setup, root)) break; // SP3–SP4, EG2–EG4
    }
    const { rows, winners } = finalStandings(root); // EG5–EG7
    for (const r of rows) {
      r.p.scoreSpark.value = r.net;
      setup.log(
        `${r.p.logKey}: ${r.p.score} points − ${r.stones} time stones = ${r.net}.`,
      );
    }
    return { winners };
  }

  renderDefaultRootChit(spec: ChitRenderSpec): void {
    spec.lightSpec = LightSpec.realistic();
  }
}
