"""Detect the numbered building-location discs on the board scan (zone 1-4) and the two
train-station discs. Writes JSON of {x, y, r, zone} in scan pixels. Asserts nothing yet:
this is the first-pass count for RULES.md, verified against the developer's read of the board."""
import sys, json
import cv2, numpy as np

img = cv2.imread(sys.argv[1], cv2.IMREAD_COLOR)
H, W = img.shape[:2]
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
# Navy discs: dark, bluish.
b, g, r = [img[:, :, i].astype(int) for i in range(3)]
navy = ((b + g + r) < 190) & (b > r)
navy = navy.astype(np.uint8) * 255
navy[:, 2950:] = 0          # ignore the action column
navy[:, :150] = 0           # ignore the score track
navy = cv2.morphologyEx(navy, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
n, lab, stats, cent = cv2.connectedComponentsWithStats(navy)
found = []
for i in range(1, n):
    x, y, w, h, area = stats[i]
    if not (70 < w < 130 and 70 < h < 130 and abs(w - h) < 18): continue
    fill = area / (w * h)
    if fill < 0.5: continue
    cx, cy = cent[i]
    rad = (w + h) / 4
    # numeral colour: pixels inside the disc that are not navy
    yy, xx = np.ogrid[:H, :W]
    sub = img[int(cy-rad*0.6):int(cy+rad*0.6), int(cx-rad*0.6):int(cx+rad*0.6)].reshape(-1, 3).astype(int)
    bright = sub[sub.sum(1) > 300]
    if len(bright) < 30: continue
    mb, mg, mr = bright.mean(0)
    if mg > mr + 30 and mg > 140 and mb > 120 and mr < 140: zone = 1     # teal
    elif mr > mg + 40 and mr > 180: zone = 2                             # pink
    elif mr > 180 and mg > 170 and mb < 150: zone = 4                    # yellow
    elif min(mr, mg, mb) > 170: zone = 3                                 # white/grey
    else: zone = 0
    found.append(dict(x=round(cx), y=round(cy), r=round(rad), zone=zone, rgb=[round(mr), round(mg), round(mb)]))
json.dump(found, open(sys.argv[2], 'w'), indent=1)
from collections import Counter
print(len(found), Counter(f['zone'] for f in found))
for f in found:
    if f['zone'] == 0: print('unclassified', f)
