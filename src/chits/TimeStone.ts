import { Chit, ChitRenderSpec } from "@pretty-chitty/core";
import { Mesh, SphereGeometry } from "three";
import { SIZE } from "../consts";
import { galleryFit, outlineFor, phong, piece } from "../render";

const GLASS = { blue: "#1d4fb8", green: "#1f9a3a" };

/** A glass time stone (C7). Taken when a player stops time; worth −1 point (CL6). */
export class TimeStone extends Chit {
  glass: "blue" | "green" = "blue";

  render(spec: ChitRenderSpec): void {
    piece(spec, "marker");
    const g = new SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2); // a dome
    g.rotateX(Math.PI / 2);
    g.scale(SIZE.stoneR, SIZE.stoneR, SIZE.stoneZ);
    const m = new Mesh(g, phong(GLASS[this.glass], { shininess: 120, specular: 0xffffff as any, transparent: true, opacity: 0.88 }));
    m.castShadow = true;
    spec.object = m;
    spec.highlight.color = outlineFor(GLASS[this.glass]); // on the printed glass of its own colour
    galleryFit(spec, 1, 1, 120);
    if (this.parentOutlet === "stones") {
      spec.splay.enabled = true;
      spec.splay.rows = 1;
      spec.splay.columns = 5;
    }
    spec.summary = "**Time stone**\n\nTaken by a player who stops time: −1 point at the end. When the last one leaves the clock, the game ends at once.";
    spec.showDetailsOnLongPress = true;
  }
}
