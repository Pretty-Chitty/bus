"""The table under every panel: src/assets/environment/table.jpg.

A wooden tabletop: Poly Haven's "American Walnut Veneer" (Jenelle van Heerden, CC0; polyhaven.com), 2K colour map
in art-src/polyhaven/. Seamless as published. Greyscaled here, because setupTable (src/render.ts) washes it with
each panel's colour, and its contrast set so the grain shows without shouting.
History: the scaffold's mottled felt read as "a windows 95 wallpaper"; a generated flat felt was "bad too" (the
developer).
    python3 -P scripts/art/build_table.py
"""
import os
import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src = cv2.imread(os.path.join(ROOT, "art-src/polyhaven/american_walnut_veneer_diff_2k.jpg"))
assert src is not None and src.shape[:2] == (2048, 2048)
g = cv2.cvtColor(src, cv2.COLOR_BGR2GRAY).astype(np.float32)
g = cv2.resize(g, (1024, 1024), interpolation=cv2.INTER_AREA)
MEAN, SPREAD = 125, 22
g = (g - g.mean()) / g.std() * SPREAD + MEAN
img = np.clip(g, 0, 255).astype(np.uint8)
cv2.imwrite(os.path.join(ROOT, "src/assets/environment/table.jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, 82])
print("table.jpg", img.shape, round(float(img.mean()), 1), round(float(img.std()), 1),
      os.path.getsize(os.path.join(ROOT, "src/assets/environment/table.jpg")) // 1024, "KB")
