#!/usr/bin/env python3
"""
json_to_png.py - Convert JSON grid to PNG image
"""

import json
from pathlib import Path
from PIL import Image

# Color palette
PALETTE_HEX = [
    "#D4C454",  # 1 wall yellow
    "#447604",  # 2 avocado green
    "#208AAE",  # 3 blue
    "#F28482",  # 4 coral
]

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

PALETTE = [hex_to_rgb(h) for h in PALETTE_HEX]

def json_to_png(json_path: Path, png_path: Path):
    with open(json_path, 'r') as f:
        grid = json.load(f)
    
    height = len(grid)
    width = len(grid[0]) if grid else 0
    
    img = Image.new('RGB', (width, height))
    pixels = []
    
    for row in grid:
        for char in row:
            color_index = int(char) - 1  # Convert 1-4 to 0-3
            pixels.append(PALETTE[color_index])
    
    img.putdata(pixels)
    img.save(png_path)
    print(f"✅ Converted {json_path} → {png_path}")

if __name__ == "__main__":
    # List of all new foods to convert
    new_foods = [
        "strawberry", "carrot", "mushroom", "orange", "tomato", 
        "corn", "grape", "avocado", "cherry", "lemon", 
        "pepper", "cookie", "pretzel", "taco", "hamburger", "cake"
    ]
    
    for food in new_foods:
        json_path = Path(f"foods/{food}.json")
        png_path = Path(f"food_png/{food}.png")
        if json_path.exists():
            json_to_png(json_path, png_path)
        else:
            print(f"❌ {json_path} not found")