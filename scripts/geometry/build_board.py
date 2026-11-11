"""Measure the Bus board scan into src/geometry/board.ts.

Detects, on art-src/tts/board.png (3894x2753, the Capstone 2019 board from the TTS mod):
  - crossings: plain (grey dot), roundabouts (ringed orange disc, 4), train stations (blue disc, 2)
  - streets: straight white bands joining two crossings with no crossing between them
  - building locations: the numbered navy discs, their zone (numeral colour) and the crossing
    their leader line runs to
  - the action area: every printed action space, the clock, its stone spaces, the bus depot

Every family's count is asserted. Rerun after changing anything here:
    python3 -P scripts/geometry/build_board.py
Writes src/geometry/board.ts (do not edit) and a check image to art-build/board-check.jpg.
"""
import json, math, os, sys
import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "art-src/tts/board.png")
OUT_TS = os.path.join(ROOT, "src/geometry/board.ts")
BUILD = os.path.join(ROOT, "art-build")
os.makedirs(BUILD, exist_ok=True)

img = cv2.imread(SRC, cv2.IMREAD_COLOR)
H, W = img.shape[:2]
assert (W, H) == (3894, 2753), (W, H)
B, G, R = [img[:, :, i].astype(np.int32) for i in range(3)]
MAP_X0, MAP_X1 = 200, 2990          # city map; left of it is the score track, right the action area


def expect(name, got, want):
    if got != want:
        raise SystemExit(f"FAIL {name}: found {got}, expected {want}")
    print(f"ok   {name}: {got}")


def components(mask, amin, amax, aspect=1.6):
    n, lab, stats, cent = cv2.connectedComponentsWithStats(mask.astype(np.uint8))
    out = []
    for i in range(1, n):
        x, y, w, h, a = stats[i]
        if amin <= a <= amax and max(w, h) / max(1, min(w, h)) <= aspect:
            out.append((float(cent[i][0]), float(cent[i][1]), w, h, a))
    return out


# ---------------------------------------------------------------- white street bands
white = (R > 215) & (G > 215) & (B > 205) & (np.abs(R - B) < 40)
white_closed = cv2.morphologyEx(white.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))


def ring_white(x, y, r):
    """Fraction of white pixels on a ring of radius r round (x, y)."""
    hits = 0
    for k in range(48):
        a = 2 * math.pi * k / 48
        xx, yy = int(round(x + r * math.cos(a))), int(round(y + r * math.sin(a)))
        if 0 <= xx < W and 0 <= yy < H and white_closed[yy, xx]:
            hits += 1
    return hits / 48


# ---------------------------------------------------------------- plain crossings: grey dots
dot = (B > R + 15) & (B > 140) & (B < 225) & (R > 100) & (R < 200)
dot[:, :MAP_X0] = 0
dot[:, MAP_X1:] = 0
dot = cv2.morphologyEx(dot.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
plain = []
for (x, y, w, h, a) in components(dot, 250, 1400, 1.5):
    if ring_white(x, y, 24) > 0.6:
        plain.append((x, y))

# ---------------------------------------------------------------- stations: large blue discs
blue = (B > 150) & (R < 90) & (G > 80) & (G < 150)
blue[:, :MAP_X0] = 0
blue[:, MAP_X1:] = 0
stations = [(x, y, (w + h) / 4) for (x, y, w, h, a) in components(blue, 5000, 60000, 1.3)]
expect("train stations", len(stations), 2)

# ---------------------------------------------------------------- roundabouts: template matching
# A roundabout is a white disc with a dark ring round an orange centre. Take the template from
# the first one found by a coarse search for "orange centre fully enclosed by dark then white".
dark = (R + G + B) < 200
orange = (R > 200) & (G > 110) & (G < 215) & (B < 175)
ringdark = (R + G + B) < 360   # the ring is thin, so its pixels blend with the white
cands = []
for (x, y, w, h, a) in components(orange & ~dark, 600, 1100, 1.2):
    if not (MAP_X0 < x < MAP_X1) or not (26 <= w <= 42 and 26 <= h <= 42):
        continue
    rr = (w + h) / 4
    # a dark ring hugs the orange centre, and the white roundabout disc lies beyond it
    dk = max(np.mean([ringdark[int(y + r * math.sin(t)), int(x + r * math.cos(t))]
                      for t in np.linspace(0, 2 * math.pi, 36, endpoint=False)]) for r in range(int(rr) + 2, int(rr) + 12))
    if dk > 0.5 and ring_white(x, y, rr + 22) > 0.8:
        cands.append((x, y, rr))
roundabouts = cands
expect("roundabouts", len(roundabouts), 4)

crossings = []
for (x, y) in plain:
    crossings.append(dict(x=x, y=y, kind="plain"))
for (x, y, r) in roundabouts:
    crossings.append(dict(x=x, y=y, kind="roundabout"))
for (x, y, r) in stations:
    crossings.append(dict(x=x, y=y, kind="station"))
# label crossings in reading order (rows of 200 px, then x), so ids are stable across reruns
crossings.sort(key=lambda c: (round(c["y"] / 200), c["x"]))
for i, c in enumerate(crossings):
    c["id"] = f"X{i + 1:02d}"
expect("plain crossings", len(plain), 30)
expect("crossings", len(crossings), 36)

if False:
    chk = img.copy()
    for c in crossings:
        col = {"plain": (0, 0, 255), "roundabout": (255, 0, 255), "station": (0, 200, 0)}[c["kind"]]
        cv2.circle(chk, (int(c["x"]), int(c["y"])), 30, col, 6)
        cv2.putText(chk, c["id"], (int(c["x"]) + 25, int(c["y"]) - 25), cv2.FONT_HERSHEY_SIMPLEX, 1.4, (0, 0, 0), 4)
    cv2.imwrite(os.path.join(BUILD, "crossings-check.jpg"), cv2.resize(chk[:, :MAP_X1], None, fx=0.6, fy=0.6))
    sys.exit(0)


# ---------------------------------------------------------------- streets
def node_r(c):
    return {"plain": 26, "roundabout": 50, "station": 95}[c["kind"]]


def seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(ax + t * dx - px, ay + t * dy - py), t


def on_band(x, y, nx, ny):
    """A street band is white across ~32 px. The scan is slightly warped and street names cover
    the band's middle, so look for at least 8 white pixels within 22 px either side of the line."""
    n = 0
    for o in range(-22, 23, 2):
        xx, yy = int(round(x + o * nx)), int(round(y + o * ny))
        if 0 <= xx < W and 0 <= yy < H and white[yy, xx]:
            n += 1
    return n >= 4


streets = []
for i, a in enumerate(crossings):
    for b in crossings[i + 1:]:
        L = math.hypot(b["x"] - a["x"], b["y"] - a["y"])
        if L > 1100:
            continue
        # no other crossing on (or beside) the segment
        blocked = False
        for c in crossings:
            if c is a or c is b:
                continue
            d, t = seg_dist(c["x"], c["y"], a["x"], a["y"], b["x"], b["y"])
            if 0.02 < t < 0.98 and d < node_r(c) + 10:
                blocked = True
                break
        if blocked:
            continue
        ux, uy = (b["x"] - a["x"]) / L, (b["y"] - a["y"]) / L
        nx, ny = -uy, ux
        s0, s1 = node_r(a) + 8, L - node_r(b) - 8
        if s1 - s0 < 40:
            continue
        ts = np.linspace(s0, s1, max(12, int((s1 - s0) / 8)))
        ok = np.mean([on_band(a["x"] + t * ux, a["y"] + t * uy, nx, ny) for t in ts])
        if ok > 0.78:          # long street names cover most of the band (Imperial Parkway: 0.84)
            streets.append(dict(a=a["id"], b=b["id"], score=round(float(ok), 3)))
for i, st in enumerate(streets):
    st["id"] = f"S{i + 1:02d}"

# Street names, read off the board (art-build/names-*.png: each street cut out and straightened).
STREET_NAMES = {
    "X01-X03": "Cannes Boulevard", "X01-X04": "Anglo-Persian Parkway", "X01-X07": "Royal Dutch Road",
    "X01-X08": "Wildcatter Avenue", "X02-X04": "Avalon Hill Overpass", "X02-X05": "Mayfair Lane",
    "X02-X10": "Camden & Amboy Road", "X03-X06": "Legacy Lane", "X03-X12": "Longest Road",
    "X04-X08": "Pacific Coast Avenue", "X04-X09": "Waterframe Street", "X04-X10": "Tresham Boulevard",
    "X05-X10": "Baltimore & Ohio Road", "X05-X11": "Lookout Lane", "X06-X07": "Woerden Road",
    "X06-X12": "Combat Street", "X07-X08": "Standard Street", "X07-X13": "Siap Faji Street",
    "X08-X14": "Oracle Avenue", "X09-X10": "Erie Road", "X09-X14": "Modem Road",
    "X09-X17": "Great Race Street", "X10-X11": "Boston & Maine Road", "X10-X17": "Pennsylvania Road",
    "X10-X18": "Schuylkill Valley Road", "X12-X13": "Roll and Move Road", "X12-X15": "Longest Road",
    "X13-X14": "Stealth Duck Road", "X13-X15": "Strategy Street", "X13-X19": "Chameleon Street",
    "X14-X16": "Jannink Street", "X14-X19": "Wiersinga Street", "X15-X20": "Eurogame Avenue",
    "X15-X21": "Longest Road", "X16-X17": "D'r Af Street", "X16-X22": "Doumen Street",
    "X17-X18": "Pizza Street", "X17-X23": "Billboard Avenue", "X17-X24": "Food Chain Alley",
    "X18-X24": "Milestone Lane", "X19-X21": "Gossip Alley", "X19-X22": "Haverkort Street",
    "X20-X25": "Whistle Street", "X20-X29": "Cooperative Lane", "X21-X25": "Steam Street",
    "X21-X26": "Longest Road", "X22-X23": "Pennybags Lane", "X22-X26": "Climber Street",
    "X22-X30": "Boats Road", "X22-X31": "American Avenue", "X23-X24": "Garden Street",
    "X23-X27": "Tower Road", "X24-X28": "Worldwide Lane", "X25-X26": "Gauge Road",
    "X25-X29": "Rivals Road", "X25-X32": "Ticket Lane", "X25-X33": "Express Road",
    "X25-X36": "Union Street", "X26-X30": "Penny Lane", "X26-X33": "Yellow Brick Road",
    "X26-X34": "Longest Road", "X27-X28": "Festival Avenue", "X27-X31": "Luxor Lane",
    "X28-X35": "Imperial Parkway", "X30-X34": "82nd Street", "X31-X34": "Estate Boulevard",
    "X31-X35": "Continental Street", "X32-X36": "Pipe Lane", "X33-X34": "Love Street",
    "X33-X36": "Wei Overpass",
}
for st in streets:
    st["name"] = STREET_NAMES[f"{st['a']}-{st['b']}"]
expect("named streets", len({f"{st['a']}-{st['b']}" for st in streets} & set(STREET_NAMES)), len(STREET_NAMES))
expect("streets", len(streets), 70)
print("     weakest streets:", sorted((st["score"], st["a"], st["b"]) for st in streets)[:4])

# ---------------------------------------------------------------- building locations
navy = (((B + G + R) < 190) & (B > R)).astype(np.uint8) * 255
navy[:, :MAP_X0] = 0
navy[:, MAP_X1:] = 0
navy = cv2.morphologyEx(navy, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (27, 27)))  # close the numeral (street bands are wider)
cnts, _ = cv2.findContours(navy, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
for cnt in cnts:                                                            # fill the numeral's hole
    if cv2.contourArea(cnt) < 4000:
        cv2.drawContours(navy, [cnt], -1, 255, -1)
dist = cv2.distanceTransform((navy > 0).astype(np.uint8), cv2.DIST_L2, 5)
# disc centres: local maxima of the distance to the mask edge (a disc's radius is ~45 px;
# street outlines and leaders are a few px thick)
peaks = (dist > 30) & (dist == cv2.dilate(dist, np.ones((61, 61), np.uint8)))
ys, xs = np.nonzero(peaks)
centres = []
for x, y in sorted(zip(xs.tolist(), ys.tolist()), key=lambda p: -dist[p[1], p[0]]):
    if all(math.hypot(x - a, y - b) > 60 for a, b, _ in centres):
        centres.append((x, y, float(dist[y, x])))
locations = []
for (x, y, dd) in centres:
    rad = dd
    sub = img[int(y - rad * 0.55):int(y + rad * 0.55), int(x - rad * 0.55):int(x + rad * 0.55)].reshape(-1, 3).astype(int)
    bright = sub[sub.sum(1) > 300]
    if len(bright) < 30:
        continue
    mb, mg, mr = bright.mean(0)
    if mg > mr + 30 and mg > 140 and mb > 120 and mr < 140: zone = 1      # teal
    elif mr > mg + 40 and mr > 180: zone = 2                              # pink
    elif mr > 180 and mg > 170 and mb < 150: zone = 4                     # yellow
    elif min(mr, mg, mb) > 170: zone = 3                                  # white
    else:
        raise SystemExit(f"FAIL unclassified location numeral at {x:.0f},{y:.0f}: {mr:.0f},{mg:.0f},{mb:.0f}")
    locations.append(dict(x=x, y=y, r=rad, zone=zone))
expect("building locations", len(locations), 47)
for z, n in {1: 12, 2: 11, 3: 9, 4: 15}.items():
    expect(f"zone {z} locations", sum(1 for l in locations if l["zone"] == z), n)

# The leader: a thin dark line leaving the disc rim toward its crossing.
dark_line = ((B + G + R) < 260).astype(np.uint8)
for l in locations:
    best = None
    for c in crossings:
        L = math.hypot(c["x"] - l["x"], c["y"] - l["y"])
        if L > 420:
            continue
        ux, uy = (c["x"] - l["x"]) / L, (c["y"] - l["y"]) / L
        # sample from just outside the disc to just short of the crossing's white band
        s0, s1 = l["r"] + 6, L - node_r(c) - 18
        if s1 <= s0:
            frac = 1.0
        else:
            ts = np.linspace(s0, s1, max(6, int((s1 - s0) / 4)))
            hits = []
            for t in ts:
                xx, yy = l["x"] + t * ux, l["y"] + t * uy
                hits.append(any(dark_line[int(yy + o * ux), int(xx - o * uy)] for o in (-3, -1, 0, 1, 3)))
            frac = float(np.mean(hits))
        score = frac - L / 4000
        if best is None or score > best[0]:
            best = (score, c["id"], frac, L)
    if best[2] < 0.8:
        # a very short leader (the disc almost touches its crossing): take the nearest crossing,
        # and only if it is clearly the nearest
        ds = sorted((math.hypot(c["x"] - l["x"], c["y"] - l["y"]), c["id"]) for c in crossings)
        if not (ds[0][0] < 200 and ds[0][0] < 0.7 * ds[1][0]):
            raise SystemExit(f"FAIL no leader for location at {l['x']:.0f},{l['y']:.0f}: best {best}, nearest {ds[:2]}")
        print(f"     short leader at {l['x']:.0f},{l['y']:.0f} -> nearest {ds[0][1]}")
        best = (0, ds[0][1], 0, ds[0][0])
    l["crossing"] = best[1]
locations.sort(key=lambda l: (l["zone"], round(l["y"] / 150), l["x"]))
for i, l in enumerate(locations):
    l["id"] = f"L{l['zone']}{i + 1:02d}"
assert not any(l["crossing"] in {c["id"] for c in crossings if c["kind"] == "station"} for l in locations), "a location on a station"


# ---------------------------------------------------------------- check image (map)
chk = img.copy()
cid = {c["id"]: c for c in crossings}
for st in streets:
    a, b = cid[st["a"]], cid[st["b"]]
    cv2.line(chk, (int(a["x"]), int(a["y"])), (int(b["x"]), int(b["y"])), (0, 0, 255), 7)
    mx, my = (a["x"] + b["x"]) / 2, (a["y"] + b["y"]) / 2
    cv2.putText(chk, st["id"], (int(mx) - 30, int(my) + 12), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 0, 0), 4)
for c in crossings:
    cv2.circle(chk, (int(c["x"]), int(c["y"])), 22, (0, 160, 0), -1)
    cv2.putText(chk, c["id"][1:], (int(c["x"]) - 22, int(c["y"]) + 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 3)
zcol = {1: (255, 255, 0), 2: (255, 0, 255), 3: (255, 255, 255), 4: (0, 255, 255)}
for l in locations:
    c = cid[l["crossing"]]
    cv2.circle(chk, (int(l["x"]), int(l["y"])), int(l["r"]) + 4, zcol[l["zone"]], 6)
    cv2.line(chk, (int(l["x"]), int(l["y"])), (int(c["x"]), int(c["y"])), (0, 255, 0), 5)
cv2.imwrite(os.path.join(BUILD, "map-check.jpg"), cv2.resize(chk[:, :MAP_X1], None, fx=0.6, fy=0.6))


# ---------------------------------------------------------------- action area
def navy_discs(x0, x1, y0, y1, wmin, wmax):
    m = (((B + G + R) < 190) & (B > R)).astype(np.uint8) * 255
    mm = np.zeros_like(m)
    mm[y0:y1, x0:x1] = m[y0:y1, x0:x1]
    mm = cv2.morphologyEx(mm, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    cnts, _ = cv2.findContours(mm, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in cnts:
        if cv2.contourArea(cnt) < 3000:
            cv2.drawContours(mm, [cnt], -1, 255, -1)
    return [(x, y, (w + h) / 4) for (x, y, w, h, a) in components(mm > 0, 1500, 12000, 1.2) if wmin <= w <= wmax]


discs = navy_discs(3000, 3880, 300, 2700, 55, 75)
rows = {}
for (x, y, r) in discs:
    rows.setdefault(int(round(y / 40)), []).append((x, y, r))
rows = sorted(rows.values(), key=lambda row: row[0][1])
expect("action rows (incl. single spaces)", len(rows), 7)
# Printed order, top to bottom (rulebook B8), and each row's letters left to right.
ACTIONS = [("lineExpansion", "FEDCBA"), ("buses", "-"), ("passengers", "ABCDEF"), ("buildings", "FEDCBA"),
           ("clock", "-"), ("vroom", "ABCDEF"), ("startingPlayer", "-")]
action_spaces = []
for (action, letters), row in zip(ACTIONS, rows):
    row.sort()
    expect(f"{action} spaces", len(row), len(letters) if letters != "-" else 1)
    for (x, y, r), letter in zip(row, letters if letters != "-" else "A"):
        action_spaces.append(dict(action=action, letter=letter, x=x, y=y, r=r))

# Time-stone spaces: the five glass circles on the time-control device.
stone_spaces = []
for (x, y, r) in navy_discs(3450, 3880, 1780, 2200, 90, 125):
    bb, gg, rr = img[int(y) - 15:int(y) + 15, int(x) - 15:int(x) + 15].reshape(-1, 3).mean(0)
    stone_spaces.append(dict(x=x, y=y, r=r, glass="green" if gg > bb else "blue"))
expect("time-stone spaces", len(stone_spaces), 5)
stone_spaces.sort(key=lambda s_: (s_["y"], s_["x"]))

# The clock: face circle and pivot by Hough, spoke angles by a gold profile; the hand points to the
# middle of each sector. House is the sector right of the dial (rulebook S5 setup position).
win = img[1540:2240, 2780:3580]
gray = cv2.medianBlur(cv2.cvtColor(win, cv2.COLOR_BGR2GRAY), 5)
pv = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, dp=1, minDist=50, param1=120, param2=30, minRadius=14, maxRadius=30)
face = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, dp=1, minDist=50, param1=120, param2=30, minRadius=260, maxRadius=330)
ccx, ccy = pv[0][0][0] + 2780, pv[0][0][1] + 1540
fcx, fcy, fr = face[0][0][0] + 2780, face[0][0][1] + 1540, face[0][0][2]
assert math.hypot(ccx - fcx, ccy - fcy) < 6, ("pivot off the clock face centre", ccx, ccy, fcx, fcy)
prof = []
for d in range(360):
    t = math.radians(d)
    prof.append(sum(1 for r in range(60, 200, 4)
                    if (lambda px: px[2] > 200 and px[1] > 150 and px[0] < 130)(img[int(ccy + r * math.sin(t)), int(ccx + r * math.cos(t))].astype(int))))
prof = np.array(prof, float)
sm = np.array([prof[[(d + k) % 360 for k in range(-2, 3)]].mean() for d in range(360)])
spokes = []
for d in range(360):
    if sm[d] > 10 and sm[d] == max(sm[(d + k) % 360] for k in range(-20, 21)) and all(abs(d - q) > 20 for q in spokes):
        spokes.append(d)
expect("clock spokes", len(spokes), 3)
spokes.sort()
mids = [((spokes[i] + ((spokes[(i + 1) % 3] - spokes[i]) % 360) / 2) % 360) for i in range(3)]
# image angles (y down, clockwise): the sector right of the dial is the house
house = min(mids, key=lambda m: min(abs(m - 0), abs(m - 360)))
clock = dict(cx=float(ccx), cy=float(ccy), r=float(fr),
             house=house, office=(house + 120) % 360, pub=(house + 240) % 360)
for k in ("office", "pub"):
    assert min(abs(clock[k] - m) for m in mids) < 3, (k, clock, mids)

# Bus depot: 5 columns (purple, blue, green, yellow, red) x 5 slots, the coloured insets.
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
sat = ((hsv[:, :, 1] > 110) & (hsv[:, :, 2] > 90)).astype(np.uint8)
dm = np.zeros_like(sat)
dm[650:1020, 3020:3880] = sat[650:1020, 3020:3880]
dm = cv2.morphologyEx(dm, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
slots = [(x, y, w, h) for (x, y, w, h, a) in components(dm, 2000, 4000, 3.2)]
expect("depot slots", len(slots), 25)
slots.sort(key=lambda t: (round(t[0] / 80), t[1]))
depot = []
for i, (x, y, w, h) in enumerate(slots):
    bb, gg, rr = img[int(y) - 6:int(y) + 6, int(x) - 20:int(x) + 20].reshape(-1, 3).mean(0)
    depot.append(dict(col=i // 5, row=i % 5, x=x, y=y, w=float(w), h=float(h), rgb=[round(rr), round(gg), round(bb)]))

# ---------------------------------------------------------------- sampled print colours
def sample(mask):
    v = img[mask > 0].reshape(-1, 3).mean(0)
    return "#%02x%02x%02x" % (round(v[2]), round(v[1]), round(v[0]))
road_white = sample(white & (np.arange(W)[None, :] < MAP_X1))
navy_print = sample((((B + G + R) < 150) & (B > R)) & (np.arange(W)[None, :] < MAP_X1))
dot_grey = sample(dot > 0)
numeral = {}
for z in (1, 2, 3, 4):
    px = []
    for l in locations:
        if l["zone"] != z:
            continue
        sub = img[int(l["y"] - l["r"] * 0.5):int(l["y"] + l["r"] * 0.5), int(l["x"] - l["r"] * 0.5):int(l["x"] + l["r"] * 0.5)].reshape(-1, 3)
        px.append(sub[sub.astype(int).sum(1) > 330])
    v = np.concatenate(px).mean(0)
    numeral[z] = "#%02x%02x%02x" % (round(v[2]), round(v[1]), round(v[0]))

# ---------------------------------------------------------------- leaders
for l in locations:
    c = cid[l["crossing"]]
    L = math.hypot(c["x"] - l["x"], c["y"] - l["y"])
    ux, uy = (c["x"] - l["x"]) / L, (c["y"] - l["y"]) / L
    end = L - node_r(c) + 4
    l["leader"] = [l["x"] + ux * l["r"], l["y"] + uy * l["r"], l["x"] + ux * end, l["y"] + uy * end]

# ---------------------------------------------------------------- the erasure mask (for scripts/art)
# Everything the chits will draw: roads (with their printed edges and drop shadow), crossings,
# stations, roundabouts, location discs and leaders, and the score track down the left edge.
mask = np.zeros((H, W), np.uint8)
for st in streets:
    a, b = cid[st["a"]], cid[st["b"]]
    cv2.line(mask, (int(a["x"]), int(a["y"])), (int(b["x"]), int(b["y"])), 255, 66)
for c in crossings:
    cv2.circle(mask, (int(c["x"]), int(c["y"])), int(node_r(c) + 22), 255, -1)
for l in locations:
    cv2.circle(mask, (int(l["x"]), int(l["y"])), int(l["r"] + 9), 255, -1)
    x0_, y0_, x1_, y1_ = l["leader"]
    cv2.line(mask, (int(x0_), int(y0_)), (int(x1_), int(y1_)), 255, 16)
cv2.imwrite(os.path.join(BUILD, "erase-mask.png"), mask)

# ---------------------------------------------------------------- write src/geometry/board.ts
def r1(v):
    return round(float(v), 1)


ts = []
ts.append("// GENERATED by scripts/geometry/build_board.py from art-src/tts/board.png. Do not edit; rerun the builder.")
ts.append("// All coordinates are pixels on the board scan (x right, y down).")
ts.append(f"export const BOARD_PX = {{ w: {W}, h: {H} }};")
ts.append("export type CrossingKind = \"plain\" | \"roundabout\" | \"station\";")
ts.append("export const CROSSINGS: { id: string; x: number; y: number; kind: CrossingKind }[] = " + json.dumps(
    [dict(id=c["id"], x=r1(c["x"]), y=r1(c["y"]), kind=c["kind"]) for c in crossings]) + ";")
ts.append("export const STREETS: { id: string; a: string; b: string; name: string }[] = " + json.dumps(
    [dict(id=st["id"], a=st["a"], b=st["b"], name=st["name"]) for st in streets]) + ";")
ts.append("export const LOCATIONS: { id: string; x: number; y: number; r: number; zone: 1 | 2 | 3 | 4; crossing: string; leader: [number, number, number, number] }[] = " + json.dumps(
    [dict(id=l["id"], x=r1(l["x"]), y=r1(l["y"]), r=r1(l["r"]), zone=l["zone"], crossing=l["crossing"], leader=[r1(v) for v in l["leader"]]) for l in locations]) + ";")
ts.append("export const ACTION_SPACES: { action: string; letter: string; x: number; y: number; r: number }[] = " + json.dumps(
    [dict(action=a["action"], letter=a["letter"], x=r1(a["x"]), y=r1(a["y"]), r=r1(a["r"])) for a in action_spaces]) + ";")
ts.append("export const STONE_SPACES: { x: number; y: number; r: number; glass: \"blue\" | \"green\" }[] = " + json.dumps(
    [dict(x=r1(t["x"]), y=r1(t["y"]), r=r1(t["r"]), glass=t["glass"]) for t in stone_spaces]) + ";")
ts.append("/** Clock pivot and face, and the hand's angle (degrees, image space: clockwise from +x) for each building type. */")
ts.append("export const CLOCK = " + json.dumps({k: r1(v) for k, v in clock.items()}) + ";")
ts.append("/** Bus depot insets: col 0..4 = purple, blue, green, yellow, red; row 0 at the top. */")
ts.append("export const DEPOT: { col: number; row: number; x: number; y: number; w: number; h: number; rgb: number[] }[] = " + json.dumps(
    [dict(col=d["col"], row=d["row"], x=r1(d["x"]), y=r1(d["y"]), w=d["w"], h=d["h"], rgb=d["rgb"]) for d in depot]) + ";")
ts.append("export const PRINT_COLORS = " + json.dumps(dict(roadWhite=road_white, navy=navy_print, dotGrey=dot_grey,
                                                         numeral={str(k): v for k, v in numeral.items()})) + ";")
os.makedirs(os.path.dirname(OUT_TS), exist_ok=True)
open(OUT_TS, "w").write("\n".join(ts) + "\n")
print(f"wrote {OUT_TS}")
print("     colours:", road_white, navy_print, dot_grey, numeral, "clock", {k: round(v, 1) for k, v in clock.items()})

# ---------------------------------------------------------------- check image (action area)
chk2 = img[:, 2990:].copy()
for a in action_spaces:
    cv2.circle(chk2, (int(a["x"] - 2990), int(a["y"])), int(a["r"]) + 6, (0, 0, 255), 5)
    cv2.putText(chk2, a["letter"], (int(a["x"] - 2990) - 12, int(a["y"]) - 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
for t in stone_spaces:
    cv2.circle(chk2, (int(t["x"] - 2990), int(t["y"])), int(t["r"]) + 6, (255, 0, 255), 5)
for d in depot:
    cv2.rectangle(chk2, (int(d["x"] - d["w"] / 2 - 2990), int(d["y"] - d["h"] / 2)), (int(d["x"] + d["w"] / 2 - 2990), int(d["y"] + d["h"] / 2)), (0, 255, 0), 3)
for k in ("house", "office", "pub"):
    t = math.radians(clock[k])
    cv2.line(chk2, (int(clock["cx"] - 2990), int(clock["cy"])), (int(clock["cx"] - 2990 + 260 * math.cos(t)), int(clock["cy"] + 260 * math.sin(t))), (255, 0, 0), 8)
    cv2.putText(chk2, k, (int(clock["cx"] - 2990 + 200 * math.cos(t)), int(clock["cy"] + 200 * math.sin(t))), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 0, 0), 3)
cv2.imwrite(os.path.join(BUILD, "action-check.jpg"), cv2.resize(chk2, None, fx=0.5, fy=0.5))
