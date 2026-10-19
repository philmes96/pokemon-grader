import sys
from PIL import Image

im = Image.open(r'C:\Users\phill\AppData\Roaming\Hermes\composer-images\image_28fdbd.png').convert('RGB')
W, H = im.size
px = im.load()

def luma(p): return 0.299*p[0]+0.587*p[1]+0.114*p[2]

# replicate findSetBox strip
sy = round(H*0.86); sh = H-sy
sw = round(W*0.55)
print('strip', 0, sy, sw, sh)
dark = [0]*sw
for yy in range(sy, sy+sh):
    for xx in range(sw):
        if luma(px[xx, yy]) < 90: dark[xx] += 1
minY = max(3, round(sh*0.30))
runs = []
run = None
for xx in range(sw+1):
    isD = xx < sw and dark[xx] >= minY
    if isD and run is None: run = xx
    if (not isD or xx == sw) and run is not None:
        runs.append((run, xx)); run = None
print('runs:', [(a, b, b-a) for a, b in runs])
for a, b in runs:
    w = b-a
    if w >= round(sw*0.09) and w <= round(sw*0.45):
        tot = boxDark = bright = 0
        for yy in range(sy, sy+sh):
            for xx in range(a, b):
                l = luma(px[xx, yy]); tot += 1
                if l < 90: boxDark += 1
                elif l > 170: bright += 1
        frac = boxDark/tot
        print('cand', a, b, w, 'frac', round(frac,3), 'bright', round(bright/tot,3), 'OK' if frac>0.62 and bright/tot>0.008 else 'no')

# also full-column profile summary
prof = ''.join('#' if dark[xx] >= minY else ('+' if dark[xx] > 0 else '.') for xx in range(sw))
print(prof)
