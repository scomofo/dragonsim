"""
Extract dragon sprites from reference image and build game-ready sprite sheets.
Uses horizontal cyan borders to define rows, then finds sprites by content gaps within rows.
"""
from PIL import Image
import numpy as np
import os

REF_IMG = "Gemini_Generated_Image_fdza5afdza5afdza.png"
OUT_DIR = os.path.join("app", "public", "sprites")
EGGS_DIR = os.path.join("app", "public", "eggs")

# Game sprite sheet format
SHEET_COLS = 4
SHEET_ROWS = 2
FRAME_W = 352
FRAME_H = 384
CHROMA_GREEN = (0, 255, 0, 255)

# Quadrant bounds in full image coords
QUADRANTS = {
    "magma":  {"bounds": (0, 0, 680, 370),   "element": "fire"},
    "solar":  {"bounds": (690, 0, 1380, 370), "element": "storm"},
    "lunar":  {"bounds": (0, 375, 680, 752),  "element": "shadow"},
    "static": {"bounds": (690, 375, 1380, 752), "element": "ice"},
}


def is_bg_or_border(pixel, bg_samples):
    """Check if a pixel is background (teal) or border (cyan)."""
    r, g, b = int(pixel[0]), int(pixel[1]), int(pixel[2])
    # Cyan border
    if g > 140 and b > 140 and g > r + 30:
        return True
    # Dark teal background
    if r < 50 and g > 40 and b > 45 and b > r + 15:
        return True
    # Very dark background between quadrants
    if r < 80 and g < 80 and b < 85 and abs(r-g) < 20 and abs(g-b) < 20:
        return True
    return False


def find_row_boundaries(quad_arr):
    """Find row boundaries using horizontal cyan border lines.

    Real borders are thin (<=8px) strips with >50% cyan across the full width.
    Dragon content (e.g. blue ice dragons) may have moderate cyan but isn't
    consistently thin or high-coverage.
    """
    h, w = quad_arr.shape[:2]
    r, g, b = quad_arr[:,:,0].astype(float), quad_arr[:,:,1].astype(float), quad_arr[:,:,2].astype(float)
    is_cyan = (g > 140) & (b > 140) & (g > r + 30)

    row_cyan = np.sum(is_cyan, axis=1)

    # Step 1: Find candidate border lines using a HIGH threshold (>50% of width)
    # This ensures we only detect real full-width border lines, not dragon content
    high_threshold = w * 0.50

    # Also find lines at a lower threshold for quadrants with thinner borders
    low_threshold = w * 0.30

    # Find all thin, high-cyan bands (real borders)
    # A "band" is a contiguous group of rows where cyan > threshold
    def find_bands(threshold_val, max_thickness=8):
        bands = []
        in_band = False
        for y in range(h):
            if row_cyan[y] > threshold_val:
                if not in_band:
                    in_band = True
                    band_start = y
            else:
                if in_band:
                    in_band = False
                    thickness = y - band_start
                    if thickness <= max_thickness:
                        bands.append((band_start, y))
        if in_band:
            thickness = h - band_start
            if thickness <= max_thickness:
                bands.append((band_start, h))
        return bands

    # Try high threshold first
    lines = find_bands(high_threshold, max_thickness=8)

    # If too few lines found, try lower threshold
    if len(lines) < 4:
        lines = find_bands(low_threshold, max_thickness=6)

    # Convert border pairs to row regions (content between borders)
    rows = []
    for i in range(len(lines) - 1):
        top = lines[i][1]      # bottom of this border
        bottom = lines[i+1][0]  # top of next border
        if bottom - top > 20:   # skip tiny gaps
            rows.append((top, bottom))

    return rows


def find_sprites_in_row(quad_arr, row_top, row_bottom, min_sprite_w=25):
    """Find individual sprites within a row by detecting content gaps."""
    row = quad_arr[row_top:row_bottom, :, :]
    h, w = row.shape[:2]

    # Build alpha-like mask: pixel is "content" if it's not bg/border
    r, g, b = row[:,:,0].astype(float), row[:,:,1].astype(float), row[:,:,2].astype(float)

    # Background/border detection
    is_cyan = (g > 140) & (b > 140) & (g > r + 30)
    is_teal = (r < 50) & (g > 40) & (b > 45) & (b > r + 15) & (np.abs(g - b) < 40)
    is_dark = (r < 80) & (g < 80) & (b < 85) & (np.abs(r-g) < 20) & (np.abs(g-b) < 20)

    is_bg = is_cyan | is_teal | is_dark
    is_content = ~is_bg

    # Column content profile
    col_content = np.sum(is_content, axis=0)

    # Find content bands separated by gaps
    content_threshold = max(2, h * 0.05)
    sprites = []
    in_sprite = False
    sprite_start = 0
    gap_count = 0
    min_gap = 4  # minimum gap width to separate sprites

    for x in range(w):
        if col_content[x] > content_threshold:
            if not in_sprite:
                sprite_start = x
                in_sprite = True
            gap_count = 0
        else:
            if in_sprite:
                gap_count += 1
                if gap_count >= min_gap:
                    sprite_end = x - gap_count
                    if sprite_end - sprite_start >= min_sprite_w:
                        sprites.append((sprite_start, sprite_end))
                    in_sprite = False
                    gap_count = 0

    if in_sprite:
        sprite_end = w
        if sprite_end - sprite_start >= min_sprite_w:
            sprites.append((sprite_start, sprite_end))

    return sprites


def extract_sprite_image(quad_arr, row_top, row_bottom, col_left, col_right):
    """Extract a single sprite using flood-fill background removal.

    Instead of pixel-by-pixel color matching (which fails on blue dragons),
    flood-fill from the edges to find connected background, then make it
    transparent. This preserves dragon content regardless of color.
    """
    from scipy import ndimage

    cell = quad_arr[row_top:row_bottom, col_left:col_right].copy()
    h, w = cell.shape[:2]

    # Sample the background color from the corners/edges
    edge_pixels = []
    for y in range(min(3, h)):
        for x in range(w):
            edge_pixels.append(cell[y, x, :3])
    for y in range(max(0, h-3), h):
        for x in range(w):
            edge_pixels.append(cell[y, x, :3])
    for y in range(h):
        for x in range(min(3, w)):
            edge_pixels.append(cell[y, x, :3])
        for x in range(max(0, w-3), w):
            edge_pixels.append(cell[y, x, :3])

    edge_arr = np.array(edge_pixels, dtype=float)

    # Find the dominant background color(s)
    # Background is typically teal/cyan with R<100, G and B higher
    r, g, b = cell[:,:,0].astype(float), cell[:,:,1].astype(float), cell[:,:,2].astype(float)

    # Build a "could be background" mask using generous color matching
    # A pixel is "background-like" if it's close to any edge pixel color cluster
    # Use a simpler approach: background has certain color properties
    # Teal: low R, moderate-high G and B, G≈B
    # Cyan borders: bright, G and B both >150
    # Dark gaps: everything <80

    # Sample actual cell background color from corners (more reliable than guessing)
    corner_samples = []
    for cy, cx in [(0,0), (0,1), (1,0), (0,w-1), (0,w-2), (1,w-1),
                   (h-1,0), (h-1,1), (h-2,0), (h-1,w-1), (h-1,w-2), (h-2,w-1)]:
        if 0 <= cy < h and 0 <= cx < w:
            corner_samples.append(cell[cy, cx, :3].astype(float))
    corner_arr = np.array(corner_samples)
    bg_r, bg_g, bg_b = np.median(corner_arr[:,0]), np.median(corner_arr[:,1]), np.median(corner_arr[:,2])

    # Color distance from sampled background
    dist_from_bg = np.sqrt((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2)

    max_ch = np.maximum(np.maximum(r, g), b)
    min_ch = np.minimum(np.minimum(r, g), b)

    # Direct background removal (no flood fill needed for these):
    is_bright_cyan = (g > 150) & (b > 150) & (g > r + 20) & (np.abs(g - b) < 50)
    is_teal = (r < 70) & (g > 50) & (b > 55) & (np.abs(g - b) < 30)
    is_very_dark = (max_ch < 50)
    # Dark gray cell backgrounds: low brightness AND low saturation
    # Dragon body pixels are saturated (R>>G for fire, B>>R for ice) so this is safe
    is_dark_gray_bg = (max_ch < 95) & ((max_ch - min_ch) < 35)

    bg_mask = is_bright_cyan | is_teal | is_very_dark | is_dark_gray_bg | (dist_from_bg < 40)

    # Make background transparent
    cell[bg_mask, 3] = 0

    alpha = cell[:,:,3]

    # Find tight content bounds
    rows_with_content = np.any(alpha > 0, axis=1)
    cols_with_content = np.any(alpha > 0, axis=0)

    if not np.any(rows_with_content) or not np.any(cols_with_content):
        return None

    y1, y2 = np.where(rows_with_content)[0][[0, -1]]
    x1, x2 = np.where(cols_with_content)[0][[0, -1]]

    cropped = cell[y1:y2+1, x1:x2+1]
    return cropped


def build_sprite_sheet(sprite_images, filename, uniform_scale=False):
    """Build a 4x2 sprite sheet from individual frame images on green chroma key.

    If uniform_scale=True, all frames use the same scale factor (based on
    the largest frame). This prevents size-jumping between animation frames.
    """
    sheet_w = FRAME_W * SHEET_COLS
    sheet_h = FRAME_H * SHEET_ROWS
    total_frames = SHEET_COLS * SHEET_ROWS

    sheet = Image.new('RGBA', (sheet_w, sheet_h), CHROMA_GREEN)

    frames = sprite_images[:total_frames]
    while len(frames) < total_frames:
        frames.append(frames[-1] if frames else None)

    # Calculate uniform scale if requested
    global_scale = None
    if uniform_scale:
        max_w = FRAME_W - 20
        max_h = FRAME_H - 20
        scales = []
        for frame_arr in frames:
            if frame_arr is None:
                continue
            fh, fw = frame_arr.shape[:2]
            scales.append(min(max_w / fw, max_h / fh, 4.0))
        if scales:
            global_scale = min(scales)  # use smallest scale so all frames fit

    for i, frame_arr in enumerate(frames):
        if frame_arr is None:
            continue

        col = i % SHEET_COLS
        row = i // SHEET_COLS

        f_img = Image.fromarray(frame_arr)
        fw, fh = f_img.size

        max_w = FRAME_W - 20
        max_h = FRAME_H - 20
        scale = global_scale if global_scale else min(max_w / fw, max_h / fh, 4.0)
        new_w = int(fw * scale)
        new_h = int(fh * scale)
        f_img = f_img.resize((new_w, new_h), Image.LANCZOS)

        # Center horizontally, anchor to bottom of frame (ground plane)
        x_off = col * FRAME_W + (FRAME_W - new_w) // 2
        y_off = row * FRAME_H + (FRAME_H - 10 - new_h)  # 10px from bottom

        sheet.paste(f_img, (x_off, y_off), f_img)

    sheet.save(filename)
    print(f"  -> {filename} ({sheet_w}x{sheet_h}, {len(sprite_images)} frames, {'uniform' if uniform_scale else 'per-frame'} scale)")


def save_single(img_arr, filename, size=128):
    """Save a single sprite centered on transparent background."""
    img = Image.fromarray(img_arr)
    sw, sh = img.size
    scale = min((size-10)/sw, (size-10)/sh, 3.0)
    nw, nh = int(sw*scale), int(sh*scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new('RGBA', (size, size), (0,0,0,0))
    canvas.paste(img, ((size-nw)//2, (size-nh)//2), img)
    canvas.save(filename)
    print(f"  -> {filename}")


def process_quadrant(full_arr, qname, bounds, element):
    """Extract all sprites from a quadrant and build sprite sheets."""
    x1, y1, x2, y2 = bounds
    quad = full_arr[y1:y2, x1:x2].copy()
    qh, qw = quad.shape[:2]

    print(f"\n{'='*50}")
    print(f"{qname} -> {element} (quad {qw}x{qh})")

    # Find row boundaries
    rows = find_row_boundaries(quad)
    print(f"  Rows found: {len(rows)}")
    for i, (rt, rb) in enumerate(rows):
        print(f"    Row {i}: y={rt}-{rb} (h={rb-rt})")

    # Extract sprites from each row
    all_sprites = []
    row_sprites = []

    for ri, (rt, rb) in enumerate(rows):
        sprite_cols = find_sprites_in_row(quad, rt, rb)
        row_data = []

        for ci, (cl, cr) in enumerate(sprite_cols):
            img = extract_sprite_image(quad, rt, rb, cl, cr)
            if img is not None:
                h, w = img.shape[:2]
                row_data.append({
                    'img': img,
                    'row': ri, 'col': ci,
                    'w': w, 'h': h,
                    'area': w * h,
                })

        print(f"    Row {ri}: {len(row_data)} sprites, sizes: {[(s['w'],s['h']) for s in row_data]}")
        row_sprites.append(row_data)
        all_sprites.extend(row_data)

    if not all_sprites:
        print("  WARNING: No sprites found!")
        return

    # Categorize: large sprites = dragon frames, small = eggs/hatchlings
    large = [s for s in all_sprites if s['area'] > 2000 and s['w'] > 35 and s['h'] > 35]
    small = [s for s in all_sprites if s['area'] <= 2000 or s['w'] <= 35 or s['h'] <= 35]
    small = [s for s in small if s['area'] > 300]  # filter out tiny artifacts

    # Separate idle from attack/breath frames based on width.
    # Breath frames are much wider (fire stream extends far right).
    # Use median width to detect outliers.
    if large:
        widths = sorted([s['w'] for s in large])
        median_w = widths[len(widths) // 2]
        # Frames wider than 1.4x median are breath/attack poses
        idle_sprites = [s for s in large if s['w'] <= median_w * 1.4]
        attack_sprites = [s for s in large if s['w'] > median_w * 1.4]
        # Add remaining idle sprites to attack if we have more than 8
        if len(idle_sprites) > 8:
            attack_sprites = idle_sprites[8:] + attack_sprites
            idle_sprites = idle_sprites[:8]
    else:
        idle_sprites = []
        attack_sprites = []

    print(f"  Idle: {len(idle_sprites)}, Attack: {len(attack_sprites)}, Small: {len(small)}")

    # Build idle sprite sheet — use UNIFORM scale across all frames
    if idle_sprites:
        build_sprite_sheet([s['img'] for s in idle_sprites],
                           os.path.join(OUT_DIR, f"{element}.png"), uniform_scale=True)

    # Build attack sprite sheet (can have mixed sizes)
    if attack_sprites:
        build_sprite_sheet([s['img'] for s in attack_sprites],
                           os.path.join(OUT_DIR, f"{element}_attack.png"))

    # Save eggs and hatchlings
    small.sort(key=lambda s: s['area'])
    if len(small) >= 1:
        save_single(small[-1]['img'], os.path.join(EGGS_DIR, f"{element}_egg.png"))
    if len(small) >= 2:
        save_single(small[-2]['img'], os.path.join(EGGS_DIR, f"{element}_hatchling.png"), size=96)


def main():
    ref_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), REF_IMG)
    print(f"Loading: {ref_path}")
    img = Image.open(ref_path).convert('RGBA')
    arr = np.array(img)
    print(f"Image size: {arr.shape[1]}x{arr.shape[0]}")

    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(EGGS_DIR, exist_ok=True)

    # Backup existing sprites
    for f in os.listdir(OUT_DIR):
        if f.endswith('.png') and not f.endswith('_bak.png'):
            src = os.path.join(OUT_DIR, f)
            bak = os.path.join(OUT_DIR, f.replace('.png', '_bak.png'))
            if not os.path.exists(bak):
                import shutil
                shutil.copy2(src, bak)
                print(f"Backed up: {f} -> {f.replace('.png', '_bak.png')}")

    for qname, qdata in QUADRANTS.items():
        process_quadrant(arr, qname, qdata["bounds"], qdata["element"])

    print(f"\n{'='*50}")
    print("Done!")


if __name__ == "__main__":
    main()
