#!/usr/bin/env python3
import struct
import zlib
import os
import math

def write_png(filename, width, height, pixels):
    """
    Writes RGBA pixel buffer to a valid PNG file.
    pixels: list of (r, g, b, a) tuples of length width * height
    """
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    # 1. Signature
    png_signature = b'\x89PNG\r\n\x1a\n'

    # 2. IHDR Chunk (width, height, 8 bit, RGBA=6, def=0, filter=0, interlace=0)
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr = chunk(b'IHDR', ihdr_data)

    # 3. IDAT Chunk (scanlines with filter byte 0)
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # filter type 0
        for x in range(width):
            idx = y * width + x
            r, g, b, a = pixels[idx]
            raw_data.extend((r, g, b, a))

    compressed = zlib.compress(bytes(raw_data), 9)
    idat = chunk(b'IDAT', compressed)

    # 4. IEND Chunk
    iend = chunk(b'IEND', b'')

    with open(filename, 'wb') as f:
        f.write(png_signature + ihdr + idat + iend)

def create_siwes_icon(size, is_maskable=False):
    pixels = []
    w = size
    h = size
    cx = w / 2.0
    cy = h / 2.0
    corner_radius = size * 0.22 if not is_maskable else 0

    # Book bounds
    scale = 0.75 if is_maskable else 0.88
    bw = int(w * 0.60 * scale)
    bh = int(h * 0.68 * scale)
    bx0 = int(cx - bw / 2.0)
    by0 = int(cy - bh / 2.0)
    bx1 = bx0 + bw
    by1 = by0 + bh

    spine_w = int(bw * 0.18)
    badge_r = int(bw * 0.24)
    badge_cx = bx1 - int(bw * 0.08)
    badge_cy = by1 - int(bh * 0.08)

    for y in range(h):
        for x in range(w):
            # Check rounded corner for canvas if not maskable
            if not is_maskable:
                # distance to closest corner
                dx = max(corner_radius - x, 0, x - (w - 1 - corner_radius))
                dy = max(corner_radius - y, 0, y - (h - 1 - corner_radius))
                if dx * dx + dy * dy > corner_radius * corner_radius:
                    pixels.append((0, 0, 0, 0))
                    continue

            # Canvas base gradient: #0f172a (15, 23, 42) -> #1e1b4b (30, 27, 75)
            t = (x + y) / (2.0 * w)
            cr = int(15 + t * 15)
            cg = int(23 + t * 8)
            cb = int(42 + t * 45)
            ca = 255

            # Outer subtle border inside canvas
            if not is_maskable and (x <= 4 or x >= w - 5 or y <= 4 or y >= h - 5):
                cr, cg, cb = int(cr * 1.3), int(cg * 1.3), int(cb * 1.3)

            # Check badge circle
            dist_badge = math.sqrt((x - badge_cx) ** 2 + (y - badge_cy) ** 2)
            if dist_badge <= badge_r:
                if dist_badge >= badge_r - 2.5: # White border
                    pixels.append((255, 255, 255, 255))
                else: # Emerald fill #10b981
                    # Checkmark inside badge
                    # Points relative to badge_cx, badge_cy: (-0.3, 0) -> (-0.05, 0.25) -> (0.35, -0.2)
                    rel_x = (x - badge_cx) / badge_r
                    rel_y = (y - badge_cy) / badge_r
                    
                    # Approximate checkmark thickness
                    is_check = False
                    # segment 1: (-0.35, 0.0) to (-0.05, 0.3)
                    # segment 2: (-0.05, 0.3) to (0.4, -0.25)
                    # Check distance to lines
                    if -0.4 <= rel_x <= -0.05 and abs((rel_y - 0.0) - (rel_x + 0.35) * 1.0) < 0.16:
                        is_check = True
                    elif -0.05 <= rel_x <= 0.45 and abs((rel_y - 0.3) - (rel_x + 0.05) * -1.2) < 0.16:
                        is_check = True

                    if is_check:
                        pixels.append((255, 255, 255, 255))
                    else:
                        pixels.append((16, 185, 129, 255))
                continue

            # Check book area
            if bx0 <= x <= bx1 and by0 <= y <= by1:
                # Book cover shadow / border
                if x == bx0 or x == bx1 or y == by0 or y == by1:
                    pixels.append((51, 65, 85, 255)) # slate-700
                elif x <= bx0 + spine_w:
                    # Purple spine #7c3aed
                    pixels.append((124, 58, 237, 255))
                else:
                    # Book pages (white with light slate text lines)
                    page_pad = int(bw * 0.08)
                    page_x0 = bx0 + spine_w + 3
                    page_x1 = bx1 - 3
                    page_y0 = by0 + 3
                    page_y1 = by1 - 3

                    # Activity lines
                    line_start_x = page_x0 + page_pad
                    line_end_x = page_x1 - page_pad
                    is_line = False

                    num_lines = 6
                    line_spacing = (page_y1 - page_y0 - 2 * page_pad) / (num_lines + 1)

                    for li in range(1, num_lines + 1):
                        ly = int(page_y0 + page_pad + li * line_spacing)
                        line_len = line_end_x - (page_pad * 2 if li % 2 == 1 else 0)
                        if abs(y - ly) <= max(1, int(size * 0.007)) and line_start_x <= x <= line_len:
                            is_line = True
                            break

                    if is_line:
                        pixels.append((148, 163, 184, 255)) # slate-400
                    else:
                        pixels.append((248, 250, 252, 255)) # slate-50
                continue

            pixels.append((cr, cg, cb, ca))

    return pixels

os.makedirs('public', exist_ok=True)

# Generate PWA assets
print("Generating pwa-192x192.png...")
write_png('public/pwa-192x192.png', 192, 192, create_siwes_icon(192, False))

print("Generating pwa-512x512.png...")
write_png('public/pwa-512x512.png', 512, 512, create_siwes_icon(512, False))

print("Generating pwa-maskable-512x512.png...")
write_png('public/pwa-maskable-512x512.png', 512, 512, create_siwes_icon(512, True))

print("Generating apple-touch-icon.png...")
write_png('public/apple-touch-icon.png', 180, 180, create_siwes_icon(180, False))

print("Generating favicon-32x32.png...")
write_png('public/favicon-32x32.png', 32, 32, create_siwes_icon(32, False))

print("Done generating PWA icon assets!")
