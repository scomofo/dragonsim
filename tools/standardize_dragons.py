import os
import glob
from PIL import Image

def standardize_frame(img, box, output_path, bg_color):
    """Crops a region, removes background, and centers the dragon in a 64x64 box."""
    # 1. Crop the 'messy' area from the sheet
    raw_crop = img.crop(box).convert("RGBA")
    
    # 2. Make the background transparent (High tolerance for JPG/PNG artifacts)
    datas = raw_crop.getdata()
    new_data = []
    for item in datas:
        # If pixel is close to the background color, make it transparent
        if all(abs(item[i] - bg_color[i]) < 45 for i in range(3)):
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
    raw_crop.putdata(new_data)

    # 3. Find the 'tight' bounding box of the dragon content
    bbox = raw_crop.getbbox()
    if not bbox:
        return False # Skip if the frame is empty
    
    dragon_only = raw_crop.crop(bbox)
    
    # 4. Create a perfect 64x64 canvas and center the dragon
    final_canvas = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    offset_x = (64 - dragon_only.width) // 2
    offset_y = (64 - dragon_only.height) // 2
    final_canvas.paste(dragon_only, (offset_x, offset_y))
    
    final_canvas.save(output_path)
    return True

def process_all_dragons():
    # Define the 4 quadrants for the Elementals sheet
    # Origins (x, y) are pushed in to avoid the 'labels' and borders
    quadrants = {
        'magma':  (15, 15),
        'solar':  (525, 15),
        'lunar':  (15, 525),
        'static': (525, 525)
    }

    # Find the files
    elemental_file = glob.glob("Gemini_Generated_Image_fdza*.png")
    icy_file = glob.glob("ice-dragon-sheet*.png")

    # 1. Process Elementals
    if elemental_file:
        img = Image.open(elemental_file[0])
        bg = img.getpixel((5, 5)) # Sample bg color
        for name, (start_x, start_y) in quadrants.items():
            out_dir = f"assets/dragons/{name}"
            if not os.path.exists(out_dir): os.makedirs(out_dir)
            
            print(f"Standardizing {name}...")
            count = 0
            for row in range(2): # First two rows are usually the 'move' animations
                for col in range(5): # 5 frames per row is safer for AI sheets
                    # AI sheets usually have ~85-90px spacing
                    left = start_x + (col * 88) 
                    top = start_y + (row * 88)
                    box = (left, top, left + 85, top + 85)
                    
                    success = standardize_frame(img, box, f"{out_dir}/{name}_{count}.png", bg)
                    if success: count += 1
    
    # 2. Process Icy (usually its own sheet starting at 0,0)
    if icy_file:
        img_icy = Image.open(icy_file[0])
        bg_icy = img_icy.getpixel((5, 5))
        out_dir = "assets/dragons/icy"
        if not os.path.exists(out_dir): os.makedirs(out_dir)
        
        print("Standardizing icy...")
        count = 0
        for row in range(2):
            for col in range(5):
                box = (15 + (col * 88), 15 + (row * 88), 15 + (col * 88) + 85, 15 + (row * 88) + 85)
                success = standardize_frame(img_icy, box, f"{out_dir}/icy_{count}.png", bg_icy)
                if success: count += 1

    print("\nProcessing Complete! Check 'assets/dragons' for individual PNGs.")

if __name__ == "__main__":
    process_all_dragons()