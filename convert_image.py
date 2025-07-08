#!/usr/bin/env python3
"""
convert_image.py  – PNG (40×40, 4-colour) ➜ foods/<name>.json
                    and auto-updates foods/manifest.json

Usage:
    python convert_image.py banana40.png
"""
import sys, os, json
from pathlib import Path
from PIL import Image

# Updated palette (R,G,B) in order → digit 1-4
PALETTE = [
    (212, 196,  84),   # 1 wall yellow (#D4C454)
    ( 68, 118,   4),   # 2 avocado green (#447604)
    ( 32, 138, 174),   # 3 blue (#208AAE)
    (242, 132, 130)    # 4 coral (#F28482)
]

FOODS_DIR      = Path("foods")
MANIFEST_PATH  = FOODS_DIR / "manifest.json"
REQUIRED_SIZE  = (40, 40)

def closest_palette_digit(rgb):
    """return '1'..'4' for the nearest colour in PALETTE"""
    dist = lambda c1, c2: sum((a-b)**2 for a, b in zip(c1, c2))
    idx  = min(range(len(PALETTE)), key=lambda i: dist(rgb, PALETTE[i]))
    return str(idx + 1)

def png_to_grid(png_path: Path):
    img = Image.open(png_path).convert("RGB")
    if img.size != REQUIRED_SIZE:
        raise ValueError(f"Image must be {REQUIRED_SIZE[0]}×{REQUIRED_SIZE[1]} pixels, got {img.size}")
    w, h = img.size
    grid = [
        ''.join(closest_palette_digit(img.getpixel((x, y))) for x in range(w))
        for y in range(h)
    ]
    return grid

def save_json_grid(grid, json_path: Path):
    json_path.parent.mkdir(parents=True, exist_ok=True)
    with open(json_path, "w") as f:
        json.dump(grid, f, indent=2)
    print(f"✅ Saved grid → {json_path}")

def update_manifest(json_filename: str):
    FOODS_DIR.mkdir(exist_ok=True)
    try:
        manifest = json.loads(MANIFEST_PATH.read_text())
        if not isinstance(manifest, list):
            raise ValueError
    except (FileNotFoundError, ValueError):
        manifest = []

    if json_filename not in manifest:
        manifest.append(json_filename)
        MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))
        print(f"🔄 Added '{json_filename}' to {MANIFEST_PATH}")
    else:
        print(f"ℹ️  '{json_filename}' already in manifest")

def main():
    if len(sys.argv) != 2:
        sys.exit("Usage: python convert_image.py <image.png>")
    png_path = Path(sys.argv[1])
    if not png_path.is_file():
        sys.exit(f"File not found: {png_path}")

    grid = png_to_grid(png_path)

    # Derive JSON filename
    json_name = png_path.stem + ".json"
    json_path = FOODS_DIR / json_name

    save_json_grid(grid, json_path)
    update_manifest(json_name)

if __name__ == "__main__":
    main()
