from PIL import Image
import colorsys

def hue_rotate(image_path, output_path, shift_deg=120):
    img = Image.open(image_path).convert('RGB')
    width, height = img.size
    pixels = img.load()
    shift = shift_deg / 360.0
    
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            h = (h + shift) % 1.0
            new_r, new_g, new_b = colorsys.hsv_to_rgb(h, s, v)
            pixels[x, y] = (int(new_r * 255), int(new_g * 255), int(new_b * 255))
            
    img.save(output_path, quality=92)
    print(f"Generated {output_path}")

hue_rotate('public/images/shoes/6.jpg', 'scratch/6-hue120.jpg', 120)
hue_rotate('public/images/shoes/6.jpg', 'scratch/6-hue220.jpg', 220)
hue_rotate('public/images/shoes/2.jpg', 'scratch/2-hue150.jpg', 150)
