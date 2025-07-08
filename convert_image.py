#!/usr/bin/env python3
"""
convert_image.py – Batch PNG (40×40, 4-colour) ➜ foods/<name>.json
                   Auto-updates foods/manifest.json

Usage:
    python convert_image.py
"""

import json
from pathlib import Path
from PIL import Image

# Palette (R,G,B) in order → digit 1-4
def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

PALETTE_HEX = [
    "#D4C454",  # 1 wall yellow
    "#447604",  # 2 avocado green
    "#208AAE",  # 3 blue
    "#F28482",  # 4 coral
]

PALETTE = [hex_to_rgb(h) for h in PALETTE_HEX]

FOODS_DIR = Path("foods")
PNG_DIR = Path("food_png")
MANIFEST_PATH = FOODS_DIR / "manifest.json"
REQUIRED_SIZE = (40, 40)

def closest_palette_digit(rgb):
    dist = lambda c1, c2: sum((a - b) ** 2 for a, b in zip(c1, c2))
    idx = min(range(len(PALETTE)), key=lambda i: dist(rgb, PALETTE[i]))
    return str(idx + 1)

def png_to_grid(png_path: Path):
    img = Image.open(png_path).convert("RGB")
    if img.size != REQUIRED_SIZE:
        raise ValueError(f"{png_path.name}: Image must be {REQUIRED_SIZE[0]}×{REQUIRED_SIZE[1]} pixels, got {img.size}")
    w, h = img.size
    return [''.join(closest_palette_digit(img.getpixel((x, y))) for x in range(w)) for y in range(h)]

def save_json_grid(grid, json_path: Path):
    json_path.parent.mkdir(parents=True, exist_ok=True)
    with open(json_path, "w") as f:
        json.dump(grid, f, indent=2)
    print(f"✅ Saved grid → {json_path}")

def load_manifest():
    try:
        manifest = json.loads(MANIFEST_PATH.read_text())
        if not isinstance(manifest, list):
            raise ValueError
        return manifest
    except (FileNotFoundError, ValueError):
        return []

def update_manifest(manifest):
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))
    print(f"📘 Updated manifest with {len(manifest)} entries")

def main():
    png_files = sorted(PNG_DIR.glob("*.png"))
    new_manifest = []

    for png_path in png_files:
        json_name = png_path.stem + ".json"
        try:
            grid = png_to_grid(png_path)
        except Exception as e:
            print(f"Error processing {png_path.name}: {e}")
            continue

        json_path = FOODS_DIR / json_name
        save_json_grid(grid, json_path)
        new_manifest.append(json_name)

    update_manifest(new_manifest)
    added = ', '.join(name.removesuffix('.json') for name in new_manifest)
    print(f"Added: {added}")

if __name__ == "__main__":
    main()
