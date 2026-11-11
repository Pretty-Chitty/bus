"""Cut the art the game ships from the board scan.

  src/assets/board/board.jpg   the board with everything the chits draw painted out: roads, crossings,
                               stations, roundabouts, building locations, leaders, and the score track
                               (scores are sparks). The map is terrain only; the action area is kept.
  src/assets/board/station.png the station's blue disc and train, with a round alpha
  src/assets/icons/*.png       action pictures for galleries and long-press, cut from the action column

Run after scripts/geometry/build_board.py (it writes art-build/erase-mask.png):
    python3 -P scripts/art/build_board_art.py
"""
import os
import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
img = cv2.imread(os.path.join(ROOT, "art-src/tts/board.png"), cv2.IMREAD_COLOR)
H, W = img.shape[:2]
mask = cv2.imread(os.path.join(ROOT, "art-build/erase-mask.png"), cv2.IMREAD_GRAYSCALE)
assert mask is not None and mask.shape == (H, W), "run scripts/geometry/build_board.py first"
B, G, R = [img[:, :, i].astype(np.int32) for i in range(3)]

# ---- the score track: circles, numbers and the line through them, down the left edge.
# Everything in the strip that is not the lake's blue (or the board's paper beyond the lake).
STRIP = (40, 225)
lake = (B > 200) & (G > 150) & (R < 170)
track = np.zeros((H, W), np.uint8)
x0, x1 = STRIP
track[:, x0:x1] = (~lake[:, x0:x1]).astype(np.uint8) * 255
paper = (R > 200) & (G > 200) & (B > 200) & (np.abs(R - B) < 25)
# keep the board's own paper margin (outside the lake) — only the line crosses it
lake_rows = lake[:, x0:x1].any(axis=1)
for y in range(H):
    if not lake_rows[y]:
        track[y, x0:x1] = 0
track = cv2.morphologyEx(track, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
# the vertical line runs past the lake into the paper margin, top and bottom
line_x = int(np.argmax((((B + G + R) < 250)[:, x0:x1]).sum(axis=0))) + x0
track[:, line_x - 6:line_x + 7] = np.where((((B + G + R) < 330)[:, line_x - 6:line_x + 7]), 255, track[:, line_x - 6:line_x + 7])
track = cv2.dilate(track, np.ones((9, 9), np.uint8))
full = cv2.bitwise_or(mask, track)

# ---- fill. Lake under the track: a seamless lake tile (mirrored 2x2) keeps the halftone.
out = img.copy()
ly0 = 1600
patch = img[ly0:ly0 + 160, 230:390]          # clean lake beside the track (checked in the contact sheet)
assert lake[ly0:ly0 + 160, 230:390].mean() > 0.95, "lake patch is not clean lake"
tile = np.vstack([np.hstack([patch, patch[:, ::-1]]), np.hstack([patch[::-1], patch[::-1, ::-1]])])
reps = (H // tile.shape[0] + 1, (x1 - x0 + 40) // tile.shape[1] + 1, 1)
lake_fill = np.tile(tile, reps)[:H, :x1 - x0 + 40]
lake_zone = np.zeros((H, W), np.uint8)
lake_zone[:, x0 - 20:x1 + 20] = 255
lake_zone = cv2.bitwise_and(lake_zone, track)
lake_zone[~np.repeat(lake_rows[:, None], W, axis=1)] = 0
sel = lake_zone > 0
out[:, x0 - 20:x1 + 20][sel[:, x0 - 20:x1 + 20]] = lake_fill[sel[:, x0 - 20:x1 + 20]]
rest = cv2.bitwise_and(full, cv2.bitwise_not(lake_zone))
# The roads' thick printed edge (a drop shadow) can sit outside the measured band where the scan is
# warped: take in every dark pixel touching the mask.
near = cv2.dilate(rest, np.ones((31, 31), np.uint8)) > 0
dark_edge = ((B + G + R) < 330) & near
rest = cv2.dilate(cv2.bitwise_or(rest, dark_edge.astype(np.uint8) * 255), np.ones((5, 5), np.uint8))
rest[:, 2990:] = 0                        # the action area keeps its print
rest = cv2.bitwise_or(rest, mask)         # ...except what the mask itself names
# Most of the fill is covered by a chit drawn on top. Telea gives the smooth colour; a seamless
# halftone tile of the nearest terrain (city, park, lake) gives it the print's texture back.
smooth = cv2.inpaint(out, rest, 9, cv2.INPAINT_TELEA)
TILES = {"city": (2380, 1810), "park": (520, 100), "lake": (250, 1570)}
filled = smooth.copy()
sel = rest > 0
ys, xs = np.nonzero(sel)
sm = smooth[ys, xs].astype(np.float32)
best = None
for name, (tx, ty) in TILES.items():
    p_ = img[ty:ty + 128, tx:tx + 128]
    t_ = np.vstack([np.hstack([p_, p_[:, ::-1]]), np.hstack([p_[::-1], p_[::-1, ::-1]])]).astype(np.float32)
    mean = t_.reshape(-1, 3).mean(0)
    d = np.linalg.norm(sm - mean, axis=1)
    tex = t_[ys % 256, xs % 256] + (sm - mean) * 0.6
    if best is None:
        best = (d, tex)
    else:
        closer = d < best[0]
        best = (np.where(closer, d, best[0]), np.where(closer[:, None], tex, best[1]))
filled[ys, xs] = np.clip(best[1], 0, 255).astype(np.uint8)
soft = cv2.GaussianBlur((rest > 0).astype(np.float32), (7, 7), 0)[:, :, None]
out = (filled.astype(np.float32) * soft + out.astype(np.float32) * (1 - soft)).astype(np.uint8)

# ---- the bus depot's coloured insets, lightened 30% toward white, so the wooden buses on them stand out from the
# print (the developer: desaturating was "the wrong term. can we lighten the bus panel? like 30%?").
import json as _json
_geo = open(os.path.join(ROOT, "src/geometry/board.ts")).read()
_dep = _json.loads(_geo.split("export const DEPOT")[1].split("= ", 1)[1].split(";\n")[0])
DEPOT_LIGHTEN = 0.3
for d in _dep:
    x0_, x1_ = int(d["x"] - d["w"] / 2 - 8), int(d["x"] + d["w"] / 2 + 8)
    y0_, y1_ = int(d["y"] - d["h"] / 2 - 8), int(d["y"] + d["h"] / 2 + 8)
    cell = out[y0_:y1_, x0_:x1_].astype(np.float32)
    out[y0_:y1_, x0_:x1_] = np.clip(cell + (255 - cell) * DEPOT_LIGHTEN, 0, 255).astype(np.uint8)

os.makedirs(os.path.join(ROOT, "src/assets/board"), exist_ok=True)
scale = 0.7
small = cv2.resize(out, (int(W * scale), int(H * scale)), interpolation=cv2.INTER_AREA)
cv2.imwrite(os.path.join(ROOT, "src/assets/board/board.jpg"), small, [cv2.IMWRITE_JPEG_QUALITY, 86])
cv2.imwrite(os.path.join(ROOT, "art-build/board-erased-preview.jpg"), cv2.resize(out, None, fx=0.45, fy=0.45))
print("board.jpg", small.shape, os.path.getsize(os.path.join(ROOT, "src/assets/board/board.jpg")) // 1024, "KB")


# ================================================================ icons and outlines
import json, math, sys
sys.path.insert(0, os.path.join(ROOT, "scripts/geometry"))
ICONS = os.path.join(ROOT, "src/assets/icons")
os.makedirs(ICONS, exist_ok=True)
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
paper = (hsv[:, :, 1] < 40) & (hsv[:, :, 2] > 170)


def cut_icon(x0, y0, x1, y1, name, size=256, largest=False):
    """Crop the non-paper ink in a window, make paper transparent, square it, and save."""
    win = img[y0:y1, x0:x1]
    ink = ~paper[y0:y1, x0:x1]
    ink = cv2.morphologyEx(ink.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, ce = cv2.connectedComponentsWithStats(ink)
    keep = np.zeros_like(ink)
    for i in range(1, n):
        w_, h_ = st[i][2], st[i][3]
        if st[i][4] > 150 and not (w_ > 4 * h_ and h_ < 14):     # drop printed rule lines
            keep[lab == i] = 1
    if largest:
        n2, lab2, st2, _ = cv2.connectedComponentsWithStats(keep)
        keep = (lab2 == 1 + int(np.argmax(st2[1:, 4]))).astype(np.uint8)
    keep = cv2.erode(keep, np.ones((5, 5), np.uint8))           # no paper fringe
    ys, xs = np.nonzero(keep)
    assert len(xs) > 200, f"no ink for {name}"
    bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    alpha = cv2.GaussianBlur((keep * 255).astype(np.uint8), (3, 3), 0)
    rgba = np.dstack([win, alpha])[by0:by1, bx0:bx1]
    h, w = rgba.shape[:2]
    side = max(h, w) + 16
    sq = np.zeros((side, side, 4), np.uint8)
    sq[(side - h) // 2:(side - h) // 2 + h, (side - w) // 2:(side - w) // 2 + w] = rgba
    sq = cv2.resize(sq, (size, size), interpolation=cv2.INTER_AREA)
    cv2.imwrite(os.path.join(ICONS, name + ".png"), sq)
    return (x0 + bx0, y0 + by0, x0 + bx1, y0 + by1), keep[by0:by1, bx0:bx1]


def disc_cut(cx, cy, r, name, size=256):
    win = img[int(cy - r):int(cy + r), int(cx - r):int(cx + r)]
    yy, xx = np.mgrid[:win.shape[0], :win.shape[1]]
    alpha = (((xx - r) ** 2 + (yy - r) ** 2) <= (r - 1) ** 2).astype(np.uint8) * 255
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
    rgba = cv2.resize(np.dstack([win, alpha]), (size, size), interpolation=cv2.INTER_AREA)
    cv2.imwrite(os.path.join(ICONS, name + ".png"), rgba)


# The action pictures sit at the right of each action row (rows from the generated geometry).
geo = open(os.path.join(ROOT, "src/geometry/board.ts")).read()
spaces = json.loads(geo.split("export const ACTION_SPACES")[1].split("= ", 1)[1].split(";\n")[0])
row_y = {}
for a in spaces:
    row_y.setdefault(a["action"], []).append(a["y"])
row_y = {k: sum(v) / len(v) for k, v in row_y.items()}
cut_icon(3640, int(row_y["lineExpansion"] - 140), 3880, int(row_y["lineExpansion"] + 80), "lineExpansion")
pbox, pmask = cut_icon(3640, int(row_y["passengers"] - 150), 3880, int(row_y["passengers"] + 30), "passengers")
cut_icon(3640, int(row_y["buildings"] - 150), 3880, int(row_y["buildings"] + 30), "buildings")
cut_icon(3640, int(row_y["vroom"] - 150), 3880, int(row_y["vroom"] + 30), "vroom", largest=True)
clock = json.loads(geo.split("export const CLOCK = ")[1].split(";\n")[0])
disc_cut(clock["cx"], clock["cy"], clock["r"] + 8, "clock")
# the depot (all 25 insets) stands for Buses
dep = json.loads(geo.split("export const DEPOT")[1].split("= ", 1)[1].split(";\n")[0])
dx0 = int(min(d["x"] - d["w"] / 2 for d in dep)) - 14
dx1 = int(max(d["x"] + d["w"] / 2 for d in dep)) + 14
dy0 = int(min(d["y"] - d["h"] / 2 for d in dep)) - 14
dy1 = int(max(d["y"] + d["h"] / 2 for d in dep)) + 14
depot_crop = img[dy0:dy1, dx0:dx1]
cv2.imwrite(os.path.join(ICONS, "buses.jpg"), cv2.resize(depot_crop, (300, int(300 * depot_crop.shape[0] / depot_crop.shape[1])), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
# the train station: its blue disc and white train, from the north-east station
crs = json.loads(geo.split("export const CROSSINGS")[1].split("= ", 1)[1].split(";\n")[0])
st = [c for c in crs if c["kind"] == "station"][0]
blue_r = 66
disc_cut(st["x"], st["y"], blue_r, "station", 192)

# ---- the start-bus standee: the cover illustration (TTS mod's box photo, front cover)
# (the 2019 cover from BoardGameGeek, 1000 x 710: the bus below the title, left of the pub)
box = cv2.imread(os.path.join(ROOT, "art-src/bgg-cover-2019.jpg"))
cover = box[250:570, 300:800]            # the bus, clear of the title and the credits
cv2.imwrite(os.path.join(ICONS, "standee.jpg"), cv2.resize(cover, (376, 241), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
# ---- the passenger outline, traced from the board's own passenger icon
pc, _ = cv2.findContours(pmask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
pc = max(pc, key=cv2.contourArea)
px_, py_, pw_, ph_ = cv2.boundingRect(pc)
poly = cv2.approxPolyDP(pc, 0.006 * ph_, True)[:, 0, :]
assert 12 <= len(poly) <= 80, len(poly)
pass_outline = [[round((qx - px_) / ph_, 4), round((qy - py_) / ph_, 4)] for qx, qy in poly]
pass_rgb = img[pbox[1]:pbox[3], pbox[0]:pbox[2]][pmask > 0].mean(0)
pass_hex = "#%02x%02x%02x" % (round(pass_rgb[2]), round(pass_rgb[1]), round(pass_rgb[0]))

shapes = ["// GENERATED by scripts/art/build_board_art.py. Do not edit; rerun the script.",
          "/** Traced from the board's passenger icon: points in units of the figure's height, y down. */",
          f"export const PASSENGER_OUTLINE: [number, number][] = {json.dumps(pass_outline)};",
          f"export const PASSENGER_ASPECT = {round(pw_ / ph_, 4)};",
          f"export const PASSENGER_COLOR = \"{pass_hex}\";",
          ]
open(os.path.join(ROOT, "src/geometry/shapes.ts"), "w").write("\n".join(shapes) + "\n")

# ---- building faces (TTS mod textures: white icon on the tile's colour)
BLD = os.path.join(ROOT, "src/assets/buildings")
os.makedirs(BLD, exist_ok=True)
# The icons are the mod's. The print's three shades of blue-grey (the rulebook photo, p.1) could not be told apart
# at phone size (the developer: "subtly different colors and the shape is mostly indistinguishable at a small
# scale"), so each kind has its own hue, none of them a player colour, and the icon is a third bigger.
# Mock-ups: art-build/shots/building-options.png. Keep src/consts.ts BUILDING_COLOR in step.
DISC = {"house": (0xf4, 0xef, 0xe2), "office": (0x2a, 0xa6, 0xa0), "pub": (0x8c, 0x3a, 0x2a)}
ICON = {"house": (0x1c, 0x1c, 0x2c), "office": (0xff, 0xff, 0xff), "pub": (0xff, 0xff, 0xff)}
ICON_SCALE = 1.33
for kind, fn in (("house", "building-house.jpg"), ("office", "building-office.jpg"), ("pub", "building-pub.jpg")):
    t = cv2.imread(os.path.join(ROOT, "art-src/tts", fn)).astype(np.float32)
    ground = np.median(t[:40, :40].reshape(-1, 3), axis=0)
    # how far each pixel is from the ground toward white: 0 = ground, 1 = icon
    k = np.clip(((t - ground) / np.maximum(1, 255 - ground)).mean(axis=2), 0, 1)
    hh, ww = k.shape
    big = cv2.resize(k, (int(ww * ICON_SCALE), int(hh * ICON_SCALE)), interpolation=cv2.INTER_CUBIC)
    oy, ox = (big.shape[0] - hh) // 2, (big.shape[1] - ww) // 2
    k = np.clip(big[oy:oy + hh, ox:ox + ww], 0, 1)[:, :, None]
    col = np.array(DISC[kind][::-1], np.float32)
    ink = np.array(ICON[kind][::-1], np.float32)
    out_ = col * (1 - k) + ink * k
    cv2.imwrite(os.path.join(BLD, kind + ".jpg"), cv2.resize(out_.astype(np.uint8), (256, 256), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])

# contact sheet of every icon on magenta, for checking the cuts
sheet = []
for fn in sorted(f for f in os.listdir(ICONS) if f.endswith((".png", ".jpg"))):
    im = cv2.imread(os.path.join(ICONS, fn), cv2.IMREAD_UNCHANGED)
    if im.shape[2] == 3:
        im = np.dstack([im, np.full(im.shape[:2], 255, np.uint8)])
    im = cv2.resize(im, (240, int(240 * im.shape[0] / im.shape[1])))
    bg = np.zeros((260, 260, 3), np.uint8)
    bg[:] = (255, 0, 255)
    a = im[:, :, 3:4] / 255.0
    h_, w_ = im.shape[:2]
    bg[10:10 + h_, 10:10 + w_] = (im[:, :, :3] * a + bg[10:10 + h_, 10:10 + w_] * (1 - a)).astype(np.uint8)
    cv2.putText(bg, fn, (6, 254), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    sheet.append(bg)
cv2.imwrite(os.path.join(ROOT, "art-build/icons-sheet.png"), np.hstack(sheet))
print("icons:", sorted(os.listdir(ICONS)), "passenger pts", len(pass_outline), pass_hex)
