import { Chit, ChitRenderSpec, ChildOutlet, StaticImage } from "@pretty-chitty/core";
import { BUILDING_COLOR, BUILDING_NAME, BuildingKind, SIZE } from "../consts";
import { house, office, pub } from "../assets/buildings";
import { disc, galleryFit, imageMaterial, outlineFor, phong, piece } from "../render";
import { Passenger } from "./Passenger";

const FACE = { house, office, pub };

/** The cardboard disc of one kind (the table piece, and its option in the strip). */
export function buildingMesh(kind: BuildingKind, inStrip = false) {
  // a mesh seen only in the strip needs StaticImage.material: a StaticImage.texture stays black there until
  // that image has been drawn on the table (the house option, before any house is built)
  // (its own background colour also makes it its own canvas, not one shared with another use of the image)
  const top = inStrip ? StaticImage.material(FACE[kind], { backgroundColor: BUILDING_COLOR[kind] }) : imageMaterial(FACE[kind]);
  return disc(SIZE.buildingR, SIZE.buildingThickness, top, phong(BUILDING_COLOR[kind]));
}

/** A building tile (C8): a cardboard disc showing a house, an office or a pub. A satisfied passenger stands
 *  on it (VR10); each holds at most one (VR8). */
export class Building extends Chit {
  kind: BuildingKind = "house";

  @ChildOutlet passenger?: Passenger;

  render(spec: ChitRenderSpec): void {
    piece(spec);
    spec.object = buildingMesh(this.kind);
    // the light house disc sits beside white roads: outline it in its own colour
    spec.highlight.color = outlineFor(BUILDING_COLOR[this.kind]);
    spec.childrenOffsetZ = 0;
    galleryFit(spec, 1, 1, 160);
    spec.summary = `**${BUILDING_NAME[this.kind][0].toUpperCase() + BUILDING_NAME[this.kind].slice(1)}**\n\nWhen the clock shows a ${BUILDING_NAME[this.kind]}, a passenger at this crossing can be here.`;
    spec.showDetailsOnLongPress = true;
  }
}
