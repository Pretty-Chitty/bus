import { Chit, ChitRenderSpec } from "@pretty-chitty/core";
import { BoxGeometry, DoubleSide, Group, Mesh, PlaneGeometry } from "three";
import { SIZE } from "../consts";
import { standee } from "../assets/icons";
import { galleryFit, imageMaterial, outlineFor, phong, piece } from "../render";

/** How far the standee leans back from upright, so the table's camera sees its picture. */
const LEAN = (60 * Math.PI) / 180;

/** The start-bus (C9, S8, SP1): a cardboard standee of the cover's bus in a clear plastic foot. */
export class StartBus extends Chit {
  render(spec: ChitRenderSpec): void {
    piece(spec, "marker");
    const W = SIZE.standeeW,
      H = SIZE.standeeH;
    // the card, built upright in its own plane (picture reading upright), then leant back on its foot
    const card = new Group();
    const front = new Mesh(new PlaneGeometry(W, H), imageMaterial(standee));
    front.position.z = 0.008;
    const back = new Mesh(new PlaneGeometry(W, H), phong("#d9d4c7"));
    back.rotation.y = Math.PI;
    back.position.z = -0.008;
    const edge = new Mesh(new BoxGeometry(W, H, 0.014), phong("#d9d4c7"));
    card.add(front, back, edge);
    card.position.y = H / 2; // pivot at the bottom edge
    const stand = new Group().add(card);
    stand.rotation.x = Math.PI / 2 - LEAN; // stood up, then leant back toward the far side
    stand.position.z = 0.05;
    const foot = new Mesh(new BoxGeometry(W * 0.75, 0.34, 0.06), phong("#e8f0f4", { transparent: true, opacity: 0.55, side: DoubleSide }));
    foot.position.z = 0.03;
    for (const m of [front, back, edge, foot]) m.castShadow = true;
    spec.object = new Group().add(stand, foot);
    spec.highlight.color = outlineFor("#d9d4c7");
    spec.galleryRotateX = -(Math.PI / 2 - LEAN);
    galleryFit(spec, W, H, 220);
    spec.summary = "**The start-bus**\n\nIts holder places the first action marker this round.";
    spec.showDetailsOnLongPress = true;
  }
}
