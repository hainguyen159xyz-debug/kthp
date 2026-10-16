from PIL import Image
import colorsys
import os

for i in range(1, 31):
    path = f'public/images/shoes/{i}.jpg'
    if os.path.exists(path):
        im = Image.open(path).convert('RGB')
        # Sample middle of image (where the shoe usually is)
        w, h = im.size
        crop = im.crop((w*0.25, h*0.25, w*0.75, h*0.75))
        avg = crop.resize((1, 1)).getpixel((0, 0))
        h_val, s_val, v_val = colorsys.rgb_to_hsv(avg[0]/255.0, avg[1]/255.0, avg[2]/255.0)
        print(f"Shoe {i:2d}: size={im.size}, center_rgb={avg}, hue={h_val*360:.0f}°, sat={s_val:.2f}, val={v_val:.2f}")
