"""Contact sheet: python3 scripts/design/sheet.py out.jpg cols maxh img1 img2 ... (crops each to maxh px of the top)."""
import sys
from PIL import Image, ImageDraw
out, cols, maxh, files = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4:]
ims = []
for f in files:
    im = Image.open(f).convert("RGB")
    im = im.crop((0, 0, im.width, min(im.height, maxh)))
    ims.append((f.split("/")[-1], im))
w = max(i.width for _, i in ims)
cell_w = 900
scaled = []
for n, i in ims:
    s = cell_w / i.width
    scaled.append((n, i.resize((cell_w, int(i.height * s)))))
cell_h = max(i.height for _, i in scaled) + 28
rows = (len(scaled) + cols - 1) // cols
sheet = Image.new("RGB", (cols * cell_w + (cols + 1) * 10, rows * cell_h + 10), "white")
d = ImageDraw.Draw(sheet)
for k, (n, i) in enumerate(scaled):
    x = 10 + (k % cols) * (cell_w + 10)
    y = 10 + (k // cols) * cell_h
    d.text((x, y), n, fill="black")
    sheet.paste(i, (x, y + 18))
sheet.save(out, quality=70)
