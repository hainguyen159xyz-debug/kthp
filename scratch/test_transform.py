from PIL import Image, ImageEnhance, ImageOps
import colorsys

def transform_shoe_color(image_path, output_path, target_style='black'):
    img = Image.open(image_path).convert('RGB')
    width, height = img.size
    
    # Process pixel by pixel or with maps
    # To be fast and clean:
    pixels = img.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            
            # Check if pixel is background (near pure white or neutral light background)
            # Most shoe product photos have white/off-white background: r > 240, g > 240, b > 240 and low saturation
            max_c = max(r, g, b)
            min_c = min(r, g, b)
            diff = max_c - min_c
            
            # If it's the white studio background, don't change it!
            if min_c > 235 and diff < 15:
                continue
                
            h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            
            if target_style == 'black':
                # Stealth Black edition: lower brightness, desaturate slightly, boost contrast
                v = v * 0.45
                s = s * 0.3
            elif target_style == 'white':
                # Clean White / Silver edition: higher brightness, low saturation
                v = min(1.0, 0.4 + v * 0.6)
                s = s * 0.15
            elif target_style == 'grey':
                # Cool Grey / Wolf Grey: desaturated midtone
                v = min(1.0, 0.3 + v * 0.5)
                s = s * 0.05
            elif target_style == 'blue':
                # Royal Blue / Navy: shift hue to blue (~0.60), moderate saturation
                h = 0.60
                s = max(0.45, min(0.85, s * 1.5 + 0.3))
                v = v * 0.9
            elif target_style == 'red':
                # Crimson / Gym Red: shift hue to red (~0.98)
                h = 0.98
                s = max(0.55, min(0.9, s * 1.6 + 0.3))
                v = v * 0.9
            elif target_style == 'orange':
                # Sunset Orange / Volt: hue ~0.08
                h = 0.08
                s = max(0.65, min(0.95, s * 1.7 + 0.3))
                v = min(1.0, v * 1.05)
            elif target_style == 'green' or target_style == 'neon_green':
                # Lime / Neon Green: hue ~0.28
                h = 0.28
                s = max(0.6, min(0.95, s * 1.7 + 0.3))
                v = min(1.0, v * 1.05)
            elif target_style == 'pink':
                # Hot Pink / Magenta: hue ~0.88
                h = 0.88
                s = max(0.5, min(0.9, s * 1.5 + 0.3))
                v = v * 0.95
            elif target_style == 'yellow':
                # Speed Yellow / Gold: hue ~0.14
                h = 0.14
                s = max(0.6, min(0.95, s * 1.6 + 0.3))
                v = min(1.0, v * 1.05)
            elif target_style == 'cyan':
                # Tiffany Cyan / Teal: hue ~0.50
                h = 0.50
                s = max(0.5, min(0.9, s * 1.6 + 0.3))
                v = min(1.0, v * 0.95)

            new_r, new_g, new_b = colorsys.hsv_to_rgb(h, s, v)
            pixels[x, y] = (int(new_r * 255), int(new_g * 255), int(new_b * 255))
            
    img.save(output_path, quality=92)
    print(f"Generated {output_path}")

transform_shoe_color('public/images/shoes/2.jpg', 'scratch/2-test-grey.jpg', 'grey')
transform_shoe_color('public/images/shoes/3.jpg', 'scratch/3-test-black.jpg', 'black')
transform_shoe_color('public/images/shoes/6.jpg', 'scratch/6-test-blue.jpg', 'blue')
