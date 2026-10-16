from PIL import Image, ImageOps, ImageEnhance
import colorsys

def create_color_variant(image_path, output_path, mode='hue', hue_shift=120, tint_color=None, darken=False, invert_light=False):
    img = Image.open(image_path).convert('RGB')
    width, height = img.size
    pixels = img.load()
    
    if mode == 'hue':
        shift = hue_shift / 360.0
        for y in range(height):
            for x in range(width):
                r, g, b = pixels[x, y]
                h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
                # If there is color saturation, rotate hue
                if s > 0.08:
                    h = (h + shift) % 1.0
                    new_r, new_g, new_b = colorsys.hsv_to_rgb(h, s, v)
                    pixels[x, y] = (int(new_r * 255), int(new_g * 255), int(new_b * 255))
    elif mode == 'tint':
        # Tint white / neutral shoe with specific RGB tint
        tr, tg, tb = tint_color
        for y in range(height):
            for x in range(width):
                r, g, b = pixels[x, y]
                # Is it part of the shoe (not dark background)?
                # For 3.jpg, background is dark (< 60) and shoe is bright (> 100)
                brightness = (r + g + b) / 3.0
                if brightness > 100:
                    # Tint shoe body
                    factor = brightness / 255.0
                    new_r = int(tr * factor * 0.85 + r * 0.15)
                    new_g = int(tg * factor * 0.85 + g * 0.15)
                    new_b = int(tb * factor * 0.85 + b * 0.15)
                    pixels[x, y] = (new_r, new_g, new_b)
    elif mode == 'darken_shoe':
        for y in range(height):
            for x in range(width):
                r, g, b = pixels[x, y]
                brightness = (r + g + b) / 3.0
                if brightness > 100:
                    # Turn bright shoe into dark/black stealth shoe
                    factor = (255 - brightness) / 255.0 * 0.6 + 0.15
                    pixels[x, y] = (int(r * factor), int(g * factor), int(b * factor))
                    
    img.save(output_path, quality=92)
    print(f"Generated {output_path}")

create_color_variant('public/images/shoes/3.jpg', 'scratch/3-test-dark.jpg', mode='darken_shoe')
create_color_variant('public/images/shoes/3.jpg', 'scratch/3-test-blue.jpg', mode='tint', tint_color=(40, 120, 220))
