// Shared render helpers. Engine behaviour these rely on is described in the board-game-port skill.
import { ChitRenderSpec, ImageSpec, StaticImage, CameraSpec } from "@pretty-chitty/core";
import {
  BoxGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  Material,
  Mesh,
  MeshPhongMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Texture,
} from "three";
import { CLICK_COLOR, LIFT } from "./consts";
import { table } from "./assets/environment";

/** Every chit: the palette click colour. */
export function clickable(spec: ChitRenderSpec) {
  spec.highlight.clickColor = CLICK_COLOR;
}

/** Outline in the piece's own colour, darkened (quality-bar §5). Near-black goes a little lighter. */
export function outlineFor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  const dark = Math.max(r, g, b) < 90;
  const f = (v: number) => Math.round(dark ? v + (255 - v) * 0.2 : v * 0.5);
  return "#" + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

/** A fresh material per mesh (a shared material receives no shadows in this engine); textures are shared. */
export function phong(color: string | number, opts: Partial<MeshPhongMaterial> = {}) {
  return new MeshPhongMaterial({ color, ...opts } as any);
}
/** Painted wood: its own colour, with a little of its own light so small or standing pieces never read
 *  nearly black (quality-bar §3). */
export function wood(hex: string, glow = 0.22) {
  return new MeshPhongMaterial({ color: hex, emissive: hex as any, emissiveIntensity: glow, shininess: 18 } as any);
}
export function imageMaterial(image: ImageSpec, opts: Partial<MeshPhongMaterial> = {}) {
  return new MeshPhongMaterial({ map: StaticImage.texture(image), ...opts } as any);
}

/** Invisible hit material: writes neither colour nor depth. */
export function hitMaterial() {
  return new MeshPhongMaterial({
    transparent: true,
    opacity: 0,
    colorWrite: false,
    depthWrite: false,
    side: DoubleSide,
  });
}
export function hitDisc(r: number, h = 0.02) {
  const g = new CylinderGeometry(r, r, h, 40);
  g.rotateX(Math.PI / 2);
  return new Mesh(g, hitMaterial());
}
export function hitBox(w: number, h: number, d = 0.02) {
  return new Mesh(new BoxGeometry(w, h, d), hitMaterial());
}

/** A cylinder lying on the table (axis = z), art on its top cap, `side` on the rest. */
export function disc(r: number, h: number, top: Material, side: Material, segments = 48) {
  const g = new CylinderGeometry(r, r, h, segments);
  g.rotateX(Math.PI / 2);
  g.rotateZ(Math.PI / 2); // the cap's UVs run sideways: turn so the art reads upright
  // CylinderGeometry groups: 0 side, 1 top (+y → +z after the turn), 2 bottom
  const m = new Mesh(g, [side, top, side]);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** A picture for galleries and long-press only: face-down, so the table never draws it (art-pipeline §5). */
export function galleryPicture(image: ImageSpec, w: number, h: number) {
  const plane = new Mesh(new PlaneGeometry(w, h), StaticImage.material(image));
  plane.rotation.y = Math.PI;
  plane.position.z = -0.01;
  return plane;
}

/** Long side ≈ px in the details view, true proportions. */
export function galleryFit(spec: ChitRenderSpec, w: number, h: number, px = 360) {
  const k = px / Math.max(w, h);
  spec.galleryPreferredWidth = Math.round(w * k);
  spec.galleryPreferredHeight = Math.round(h * k);
}

export function piece(spec: ChitRenderSpec, kind: keyof typeof LIFT = "piece") {
  clickable(spec);
  spec.zLiftRatio = LIFT[kind];
}

/** The table under a panel: the felt, greyscaled, washed with a colour (quality-bar §6). */
const tableTextures = new Map<string, Texture>();
export function setupTable(spec: ChitRenderSpec, hex: string) {
  let tex = tableTextures.get("t");
  if (!tex) {
    tex = StaticImage.texture(table, { rx: 7, ry: 7 } as any); // a walnut veneer, one tile every ~14 units
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tableTextures.set("t", tex);
  }
  const mesh = new Mesh(
    new PlaneGeometry(100, 100),
    new MeshPhongMaterial({ map: tex, color: hex, shininess: 12 }), // a sealed wooden top: grain in the colour, no emboss
  );
  mesh.position.z = -0.3;
  mesh.receiveShadow = true;
  spec.ornaments.push(mesh);
}

export function panelCamera(spec: ChitRenderSpec, pad = 6, top = 6, tilt = -0.5) {
  spec.camera = new CameraSpec();
  spec.camera.verticalRadiansRotation = tilt;
  spec.camera.paddingTop = top;
  spec.camera.paddingBottom = pad;
  spec.camera.paddingLeft = pad;
  spec.camera.paddingRight = pad;
  spec.camera.maxZoom = 3;
}

export function group(...children: any[]) {
  const g = new Group();
  children.forEach((c) => c && g.add(c));
  return g;
}

/** A box with its own material per mesh, casting and receiving shadows. */
export function box(w: number, h: number, d: number, mat: Material | Material[]) {
  const m = new Mesh(new BoxGeometry(w, h, d), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export { DirectionalLight };
