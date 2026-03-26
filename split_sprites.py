from PIL import Image, ImageChops
import os
import glob

def trim_and_center(image, size=(64, 64)):
    """Trims whitespace and centers the sprite in a fixed-size box."""
    # Find the bounding box of the actual dragon (non-transparent pixels)
    bbox = image.getbbox()
    if not bbox: return image.resize(size)
    
    # Crop to just the dragon
    dragon = image.crop(bbox)
    
    # Create a new transparent canvas and paste the dragon in the center
    new_img = Image.new("RGBA", size, (0, 0, 0, 0))
    x = (size[0] - dragon.width) // 2
    y = (size[1] - dragon.height) // 2
    new_img.paste(dragon, (x, y))
    return new_img

def process_sheet_smart(image_path, schema, output_dir):
    print(f"Aligning and Processing: {image_path}")
    img = Image.open(image_path).convert("RGBA")
    bg_color = img.getpixel((2, 2)) 
    
    # Better transparency removal
    datas = img.getdata()
    new_data = []
    for item in datas:
        if all(abs(item[i] - bg_color[i]) < 30 for i in range(3)):
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)

    # Note: AI sheets often have slight shifts. 
    # We use 'approximate' starts and then 'trim_and_center' handles the rest.
    tile_w, tile_h = 80, 80 # Using a slightly larger window to catch the dragon

    for dragon_type, config in schema.items():
        type_dir = os.path.join(output_dir, dragon_type)
        if not os.path.exists(type_dir): os.makedirs(type_dir)
        start_x, start_y = config['origin']
        
        # 1. Move Frames
        for row in range(2):
            for col in range(6):
                left = start_x + (col * 85) # AI sheets often have ~85px gaps
                top = start_y + (row * 85)
                if left + tile_w > img.size[0] or top + tile_h > img.size[1]: continue
                
                raw_sprite = img.crop((left, top, left + tile_w, top + tile_h))
                # This function is the secret sauce for alignment
                final_sprite = trim_and_center(raw_sprite, (64, 64))
                final_sprite.save(f"{type_dir}/{dragon_type}_move_{row}_{col}.png")

        print(f"Finished {dragon_type}")

# Config remains same
elemental_schema = {
    'magma':  {'origin': (10, 10)},
    'solar':  {'origin': (515, 10)},
    'lunar':  {'origin': (10, 515)},
    'static': {'origin': (515, 515)}
}

# Find and run
elemental_files = glob.glob("Gemini_Generated_Image_fdza*.png")
if elemental_files:
    process_sheet_smart(elemental_files[0], elemental_schema, 'assets/dragons')

print("Alignment script finished!")