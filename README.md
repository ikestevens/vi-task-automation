# VI Task Automation Display

Display for VI Task Automation

## What is this ? ##
This display shows our VI Task Automation percentage in a fun way.

## How does it work ? ##
- automation number is shown in the top right
- we only show blocks for the automation percentage (ex. Automation: 60% so 40% of blocks are missing), as we automate more, we'll see more blocks over time
- The visualization goes through 4 stages
  1. Random - all blocks of the 4 colors are randomly assigned
  2. Slight - 33% of the blocks align to a food image
  3. Closer - 66% of the blocks align to a food image
  4. Final - 100% of the blocks align to a food image, but the 40% missing is still there

## How to Add Food Images ##
1. Go to pixilart.com/draw
2. Add the four colors used in this project
   1. #D4C454   // 1 wall yellow
   2. #447604   // 2 avocado green
   3. #208AAE   // 3 blue
   4. #F28482   // 4 coral
3. Create a 40 x 40 pixel canvas
4. Draw a food
5. Save as a png and put it in the food_png folder
6. Use the convert_image.py script to convert it to a grid
   - `python convert_image.py`
7. Push the new json, new png and manifest change to the branch


