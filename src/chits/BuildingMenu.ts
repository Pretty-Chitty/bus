import { Chit, ChitRenderSpec, Ordered, OrderedOutlet } from "@pretty-chitty/core";
import { Group } from "three";
import { BUILDING_COLOR, BUILDING_KINDS, BUILDING_NAME, BuildingKind } from "../consts";
import { outlineFor, piece } from "../render";
import { buildingMesh } from "./Building";

/** One kind of building to erect, offered in the inline strip (the supply is unlimited, C8 and Q8, so there is no
 *  pile on the table: the developer, "select the building type then … place it"). */
export class BuildingOption extends Chit {
  kind: BuildingKind = "house";

  render(spec: ChitRenderSpec): void {
    piece(spec);
    const g = new Group();
    g.add(buildingMesh(this.kind, true));
    spec.object = g;
    spec.highlight.color = outlineFor(BUILDING_COLOR[this.kind]);
    // small and uncaptioned: the disc's picture says which it is (the developer: "no need for a label here. these
    // can be much smaller"); the name is in the long-press details
    spec.galleryPreferredWidth = 56;
    spec.galleryPreferredHeight = 56;
    const name = BUILDING_NAME[this.kind][0].toUpperCase() + BUILDING_NAME[this.kind].slice(1);
    spec.summary = `**${name}**\n\nWhen the clock shows a ${BUILDING_NAME[this.kind]}, passengers want to be in one.`;
    spec.showDetailsOnLongPress = true;
  }
}

/** Holds the three options out of sight (below the table); they show only in the strip and as a prompt's context. */
export class BuildingMenu extends Chit {
  @Ordered options = new OrderedOutlet<BuildingOption>();

  option(kind: BuildingKind): BuildingOption {
    const o = this.options.find((x) => x.kind === kind);
    if (o) return o;
    const made = new BuildingOption().set((x) => (x.kind = kind));
    this.options.add(made);
    return made;
  }
  fill() {
    for (const k of BUILDING_KINDS) this.option(k);
  }

  override shouldRenderChild(): boolean {
    return false;
  }
  render(spec: ChitRenderSpec): void {
    spec.object = new Group();
    spec.offsetZ = -6;
    spec.worthSlidingToPanelToShowChange = false;
  }
}
