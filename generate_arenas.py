"""
Generate pixel-art style arena backgrounds for Dragon Forge.
512x256, matching each element's theme from the asset generation specs.
"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import random
import os

OUT_DIR = os.path.join("app", "public", "arenas")
W, H = 512, 256

random.seed(42)


def noise_layer(w, h, scale=1.0, opacity=30):
    """Create a noise texture layer."""
    arr = np.random.randint(0, int(opacity), (h, w), dtype=np.uint8)
    arr = (arr * scale).clip(0, 255).astype(np.uint8)
    return arr


def gradient(w, h, top_color, bottom_color):
    """Create a vertical gradient."""
    img = Image.new('RGB', (w, h))
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(h):
        t = y / h
        for c in range(3):
            arr[y, :, c] = int(top_color[c] * (1 - t) + bottom_color[c] * t)
    return Image.fromarray(arr)


def add_particles(draw, count, color_range, y_range, size_range=(1, 3)):
    """Add small particle dots."""
    for _ in range(count):
        x = random.randint(0, W - 1)
        y = random.randint(y_range[0], y_range[1])
        s = random.randint(size_range[0], size_range[1])
        r = random.randint(color_range[0][0], color_range[1][0])
        g = random.randint(color_range[0][1], color_range[1][1])
        b = random.randint(color_range[0][2], color_range[1][2])
        a = random.randint(100, 255)
        draw.ellipse([x, y, x + s, y + s], fill=(r, g, b, a))


def add_ground_plane(draw, y_start, color, variation=10):
    """Draw a ground plane with some texture."""
    for y in range(y_start, H):
        t = (y - y_start) / (H - y_start)
        for x in range(0, W, 2):
            v = random.randint(-variation, variation)
            r = min(255, max(0, color[0] + v + int(t * 20)))
            g = min(255, max(0, color[1] + v + int(t * 10)))
            b = min(255, max(0, color[2] + v))
            draw.rectangle([x, y, x + 1, y], fill=(r, g, b, 255))


def add_rocks(draw, count, y_range, color_base, size_range=(8, 30)):
    """Add rocky formations."""
    for _ in range(count):
        x = random.randint(0, W)
        y = random.randint(y_range[0], y_range[1])
        w = random.randint(size_range[0], size_range[1])
        h_rock = random.randint(w // 2, w * 2)
        v = random.randint(-20, 20)
        c = tuple(min(255, max(0, c + v)) for c in color_base)
        # Simple jagged rock shape
        points = [(x, y)]
        for i in range(4):
            px = x + w * (i + 1) // 5 + random.randint(-3, 3)
            py = y - h_rock + random.randint(0, h_rock // 3)
            points.append((px, py))
        points.append((x + w, y))
        draw.polygon(points, fill=c + (255,))


def generate_magma():
    """Volcanic obsidian crag with neon orange lava veins."""
    img = Image.new('RGBA', (W, H))
    base = gradient(W, H, (30, 5, 0), (10, 2, 0))
    img.paste(base)
    draw = ImageDraw.Draw(img)

    # Lava veins (horizontal glowing lines)
    for _ in range(12):
        y = random.randint(100, H - 20)
        x = random.randint(0, W // 2)
        length = random.randint(40, 200)
        thickness = random.randint(1, 3)
        brightness = random.randint(180, 255)
        draw.line([(x, y), (x + length, y + random.randint(-10, 10))],
                  fill=(brightness, brightness // 3, 0, 200), width=thickness)
        # Glow around lava
        draw.line([(x, y - 1), (x + length, y + random.randint(-10, 10) - 1)],
                  fill=(brightness, brightness // 4, 0, 60), width=thickness + 4)

    # Dark jagged rocks
    add_rocks(draw, 15, (120, 200), (20, 15, 10), (15, 50))
    add_rocks(draw, 8, (80, 160), (30, 10, 5), (20, 60))

    # Ground plane - dark obsidian with orange glow
    add_ground_plane(draw, 180, (40, 15, 5))

    # Falling embers
    add_particles(draw, 60, ((200, 80, 0), (255, 160, 0)), (0, H - 30), (1, 2))
    # Heat haze glow at top
    for y in range(30):
        alpha = int(40 * (1 - y / 30))
        draw.line([(0, y), (W, y)], fill=(255, 100, 0, alpha))

    return img


def generate_ice():
    """Frozen crystalline cavern with glowing cyan ice."""
    img = Image.new('RGBA', (W, H))
    base = gradient(W, H, (5, 15, 35), (10, 30, 50))
    img.paste(base)
    draw = ImageDraw.Draw(img)

    # Ice crystal formations (sharp triangular shapes)
    for _ in range(20):
        x = random.randint(0, W)
        base_y = random.randint(40, 180)
        crystal_h = random.randint(20, 80)
        crystal_w = random.randint(5, 20)
        brightness = random.randint(60, 180)
        c = (brightness // 3, brightness, brightness + 30 if brightness + 30 < 256 else 255)
        # Upward icicle
        draw.polygon([(x, base_y), (x + crystal_w // 2, base_y - crystal_h),
                       (x + crystal_w, base_y)], fill=c + (180,))
        # Highlight edge
        draw.line([(x + crystal_w // 2, base_y - crystal_h), (x + crystal_w, base_y)],
                  fill=(200, 240, 255, 120), width=1)

    # Downward icicles from top
    for _ in range(15):
        x = random.randint(0, W)
        crystal_h = random.randint(15, 60)
        crystal_w = random.randint(3, 12)
        brightness = random.randint(80, 200)
        c = (brightness // 3, brightness - 20, brightness)
        draw.polygon([(x, 0), (x + crystal_w // 2, crystal_h),
                       (x + crystal_w, 0)], fill=c + (200,))

    # Ground plane - frozen
    add_ground_plane(draw, 180, (20, 50, 70))

    # Snow particles
    add_particles(draw, 80, ((180, 220, 255), (255, 255, 255)), (0, H), (1, 2))

    # Cyan glow
    for y in range(H - 40, H):
        alpha = int(30 * ((y - (H - 40)) / 40))
        draw.line([(0, y), (W, y)], fill=(0, 180, 220, alpha))

    return img


def generate_storm():
    """Storm-shattered peak with lightning."""
    img = Image.new('RGBA', (W, H))
    base = gradient(W, H, (5, 15, 25), (15, 25, 35))
    img.paste(base)
    draw = ImageDraw.Draw(img)

    # Dark clouds at top
    for _ in range(30):
        x = random.randint(-50, W)
        y = random.randint(0, 60)
        w = random.randint(40, 150)
        h_c = random.randint(15, 40)
        v = random.randint(15, 35)
        draw.ellipse([x, y, x + w, y + h_c], fill=(v, v + 5, v + 15, 200))

    # Mountain peaks
    peaks = [(0, 200), (50, 90), (120, 130), (200, 70), (280, 110),
             (360, 60), (420, 100), (480, 80), (W, 200)]
    for i in range(len(peaks) - 1):
        x1, y1 = peaks[i]
        x2, y2 = peaks[i + 1]
        points = [(x1, y1), ((x1 + x2) // 2, min(y1, y2) - random.randint(0, 20)),
                  (x2, y2), (x2, H), (x1, H)]
        v = random.randint(20, 40)
        draw.polygon(points, fill=(v, v + 3, v + 8, 255))

    # Lightning bolts
    for _ in range(3):
        x = random.randint(50, W - 50)
        points = [(x, 10)]
        cy = 10
        while cy < 160:
            cy += random.randint(10, 30)
            x += random.randint(-20, 20)
            points.append((x, cy))
        draw.line(points, fill=(200, 220, 255, 220), width=2)
        # Glow
        draw.line(points, fill=(100, 150, 255, 60), width=6)

    # Ground plane
    add_ground_plane(draw, 180, (25, 30, 40))

    # Metal debris particles
    add_particles(draw, 40, ((80, 100, 140), (180, 200, 255)), (40, 180), (1, 3))

    return img


def generate_venom():
    """Acid swamp with toxic purple mist."""
    img = Image.new('RGBA', (W, H))
    base = gradient(W, H, (10, 15, 8), (5, 20, 5))
    img.paste(base)
    draw = ImageDraw.Draw(img)

    # Murky sky with purple mist
    for y in range(80):
        alpha = int(50 * (1 - y / 80))
        draw.line([(0, y), (W, y)], fill=(80, 20, 100, alpha))

    # Gnarled dead trees
    for _ in range(8):
        x = random.randint(20, W - 20)
        base_y = random.randint(100, 180)
        trunk_h = random.randint(40, 100)
        draw.line([(x, base_y), (x + random.randint(-5, 5), base_y - trunk_h)],
                  fill=(20, 15, 10, 220), width=random.randint(2, 5))
        # Branches
        for _ in range(3):
            bx = x + random.randint(-3, 3)
            by = base_y - random.randint(trunk_h // 3, trunk_h)
            draw.line([(bx, by), (bx + random.randint(-25, 25), by - random.randint(5, 25))],
                      fill=(25, 18, 12, 200), width=1)

    # Acid pools (glowing green ellipses on ground)
    for _ in range(6):
        x = random.randint(20, W - 60)
        y = random.randint(180, H - 20)
        w = random.randint(30, 80)
        h_p = random.randint(8, 20)
        draw.ellipse([x, y, x + w, y + h_p], fill=(30, 180, 20, 100))
        draw.ellipse([x + 3, y + 2, x + w - 3, y + h_p - 2], fill=(50, 220, 30, 60))

    # Ground plane - swampy
    add_ground_plane(draw, 180, (15, 30, 10))

    # Toxic bubbles
    add_particles(draw, 50, ((50, 180, 20), (100, 255, 50)), (160, H), (1, 4))
    # Purple mist particles
    add_particles(draw, 30, ((100, 30, 140), (160, 60, 200)), (0, 120), (2, 5))

    return img


def generate_shadow():
    """Dark obsidian fortress with indigo torches."""
    img = Image.new('RGBA', (W, H))
    base = gradient(W, H, (5, 3, 12), (8, 5, 18))
    img.paste(base)
    draw = ImageDraw.Draw(img)

    # Stone pillars
    pillar_positions = [30, 130, 250, 370, 470]
    for px in pillar_positions:
        pw = random.randint(20, 35)
        v = random.randint(15, 30)
        draw.rectangle([px, 20, px + pw, H], fill=(v, v - 2, v + 5, 230))
        # Pillar highlight edge
        draw.line([(px + pw, 20), (px + pw, H)], fill=(v + 15, v + 12, v + 20, 100), width=1)
        # Torch on pillar
        tx, ty = px + pw // 2, random.randint(50, 100)
        draw.ellipse([tx - 4, ty - 6, tx + 4, ty + 2], fill=(100, 50, 200, 200))
        draw.ellipse([tx - 8, ty - 10, tx + 8, ty + 6], fill=(80, 30, 160, 60))

    # Floor runes (small glowing marks)
    for _ in range(15):
        x = random.randint(10, W - 10)
        y = random.randint(190, H - 10)
        s = random.randint(3, 8)
        draw.rectangle([x, y, x + s, y + 1], fill=(120, 60, 200, 120))

    # Ground plane - dark stone
    add_ground_plane(draw, 180, (12, 10, 20))

    # Indigo particles
    add_particles(draw, 40, ((60, 30, 120), (140, 70, 220)), (30, 180), (1, 3))

    return img


def generate_stone():
    """Sandstone canyon with carved monoliths."""
    img = Image.new('RGBA', (W, H))
    base = gradient(W, H, (60, 45, 25), (40, 30, 15))
    img.paste(base)
    draw = ImageDraw.Draw(img)

    # Distant sky (warm dusty)
    for y in range(60):
        alpha = int(60 * (1 - y / 60))
        draw.line([(0, y), (W, y)], fill=(120, 90, 50, alpha))

    # Canyon walls (tall vertical rock faces on sides)
    for side in ['left', 'right']:
        if side == 'left':
            x_range = (0, 100)
        else:
            x_range = (W - 120, W)
        for _ in range(5):
            x = random.randint(x_range[0], x_range[1])
            wall_w = random.randint(30, 70)
            wall_h = random.randint(100, 200)
            v = random.randint(50, 80)
            draw.rectangle([x, H - wall_h, x + wall_w, H],
                           fill=(v, v - 10, v - 25, 230))
            # Carved markings
            for _ in range(3):
                mx = random.randint(x + 5, x + wall_w - 5)
                my = random.randint(H - wall_h + 20, H - 20)
                draw.rectangle([mx, my, mx + 4, my + 6],
                               fill=(v + 20, v + 10, v - 10, 100))

    # Monoliths in center
    for _ in range(4):
        x = random.randint(100, W - 150)
        y = random.randint(60, 140)
        mw = random.randint(15, 35)
        mh = random.randint(50, 120)
        v = random.randint(55, 75)
        draw.rectangle([x, y, x + mw, y + mh], fill=(v, v - 8, v - 20, 200))

    # Ground plane - sandy
    add_ground_plane(draw, 180, (50, 38, 20))

    # Sand particles
    add_particles(draw, 50, ((140, 110, 60), (200, 170, 100)), (60, H), (1, 2))

    return img


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    generators = {
        'fire': generate_magma,
        'ice': generate_ice,
        'storm': generate_storm,
        'venom': generate_venom,
        'shadow': generate_shadow,
        'stone': generate_stone,
    }

    for name, gen_fn in generators.items():
        print(f"Generating arena: {name}...")
        img = gen_fn()
        # Apply slight blur for pixel art softness
        img_rgb = img.convert('RGB')
        # Scale up 2x then back for chunky pixel look
        small = img_rgb.resize((W // 2, H // 2), Image.NEAREST)
        pixelated = small.resize((W, H), Image.NEAREST)
        # Blend original with pixelated for semi-pixel look
        final = Image.blend(img_rgb, pixelated, 0.3)
        path = os.path.join(OUT_DIR, f"{name}.png")
        final.save(path)
        print(f"  -> {path} ({W}x{H})")

    print("\nDone! Arena backgrounds generated.")


if __name__ == "__main__":
    main()
